// Guard JWT global — protège toutes les routes sauf celles marquées @Public()
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Vérifie si le handler ou la classe porte le metadata IS_PUBLIC_KEY (@Public())
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Routes publiques : laisse passer sans vérifier le token
    if (isPublic) return true;

    // Routes protégées : délègue la vérification JWT à Passport (JwtStrategy.validate)
    return super.canActivate(context);
  }
}
