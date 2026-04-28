// Décorateur @CurrentUser() — injecte l'utilisateur connecté directement dans un paramètre
// Extrait req.user que JwtStrategy.validate() a placé dans la requête après validation du token
// Exemple d'usage : me(@CurrentUser() user: { id: string; role: string })
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: unknown }>();
    return request.user;
  },
);
