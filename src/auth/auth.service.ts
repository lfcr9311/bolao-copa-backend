import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import * as jwt from 'jsonwebtoken'
import { UsersService } from '../users/users.service'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService
  ) {}

  async register(name: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await this.usersService.create(name, email, passwordHash)

    return {
      user,
      token: this.signToken(user.id, user.email, user.is_admin)
    }
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithPassword(email)

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos')
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      throw new UnauthorizedException('E-mail ou senha inválidos')
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_admin: user.is_admin
      },
      token: this.signToken(user.id, user.email, user.is_admin)
    }
  }

  private signToken(userId: string, email: string, isAdmin: boolean) {
    return jwt.sign(
      {
        sub: userId,
        email,
        isAdmin
      },
      this.configService.getOrThrow<string>('JWT_SECRET'),
      {
        expiresIn: '7d'
      }
    )
  }
}
