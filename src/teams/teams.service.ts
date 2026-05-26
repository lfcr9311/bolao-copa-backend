import { ConflictException, Injectable } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class TeamsService {
  constructor(private readonly db: DatabaseService) {}

  async create(name: string, code: string, flagUrl?: string) {
    try {
      const result = await this.db.query(
        `
        INSERT INTO teams (name, code, flag_url)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [name, code.toUpperCase(), flagUrl || null]
      )

      return result.rows[0]
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Seleção já cadastrada')
      }

      throw error
    }
  }

  async findAll() {
    const result = await this.db.query(
      `
      SELECT *
      FROM teams
      ORDER BY name ASC
      `
    )

    return result.rows
  }
}
