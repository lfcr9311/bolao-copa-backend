import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as jwt from 'jsonwebtoken'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token ausente ou inválido')
    }

    const token = authHeader.substring(7)

    try {
      const payload = jwt.verify(
        token,
        this.configService.getOrThrow<string>('JWT_SECRET')
      ) as any

      request.user = {
        id: payload.sub,
        email: payload.email,
        isAdmin: payload.isAdmin
      }

      return true
    } catch (error) {
      throw new UnauthorizedException('Token inválido ou expirado')
    }
  }
}
