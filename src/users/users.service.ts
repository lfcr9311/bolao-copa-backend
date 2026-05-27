import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async create(name: string, email: string, passwordHash: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedEmail.endsWith('@voeazul.com.br')) {
      throw new BadRequestException('E-mail corporativo voeazul.com.br não é permitido')
    }

    const result = await this.db.query(
      `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, is_admin, created_at
      `,
      [name, normalizedEmail, passwordHash]
    )

    return result.rows[0]
  } catch (error: any) {
    if (error.code === '23505') {
      throw new ConflictException('E-mail já cadastrado')
    }

    throw error
  }
}

  async findAll() {
    const result = await this.db.query(
      `
      SELECT id, name, email, is_admin, created_at
      FROM users
      ORDER BY created_at DESC
      `
    )

    return result.rows
  }

  async findByEmailWithPassword(email: string) {
    const result = await this.db.query(
      `
      SELECT id, name, email, password_hash, is_admin
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    )

    return result.rows[0] || null
  }
}
