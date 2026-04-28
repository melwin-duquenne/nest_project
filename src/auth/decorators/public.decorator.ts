// Décorateur @Public() — marque une route comme accessible sans token JWT
// JwtAuthGuard lit ce metadata pour bypasser la vérification du token
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
