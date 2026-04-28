// Décorateur @Roles(...) — restreint une route aux rôles spécifiés
// Utilisé avec RolesGuard qui lit ce metadata pour autoriser ou rejeter la requête
// Exemple : @Roles(UserRole.ADMIN) → seuls les admins peuvent accéder
import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/enum/user.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
