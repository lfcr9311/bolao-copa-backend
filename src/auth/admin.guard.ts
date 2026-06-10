import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from '@nestjs/common'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()

    if (!request.user) {
      throw new ForbiddenException('Usuário não autenticado')
    }

    if (!request.user.isAdmin) {
      throw new ForbiddenException('Apenas administradores podem realizar esta ação')
    }

    return true
  }
}
