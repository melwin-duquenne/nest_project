// Guard de rôles global — vérifie que l'utilisateur a le rôle requis par @Roles()
// S'exécute après JwtAuthGuard (req.user est déjà rempli)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../users/enum/user.enum';
import { ROLES_KEY } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lit les rôles requis déclarés avec @Roles(...) sur la route ou le contrôleur
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Pas de @Roles() sur la route → tout utilisateur authentifié est autorisé
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Vérifie que le rôle de l'utilisateur connecté est dans la liste des rôles autorisés
    const { user } = context.switchToHttp().getRequest<{ user: { role: UserRole } }>();
    return requiredRoles.includes(user.role);
  }
}
