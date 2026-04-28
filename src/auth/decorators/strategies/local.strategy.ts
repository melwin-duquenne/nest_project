// Stratégie locale de Passport — utilisée uniquement pour POST /api/auth/login
// Vérifie email + mot de passe avant d'accéder au contrôleur
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Par défaut passport-local utilise "username", on le remplace par "email"
    super({ usernameField: 'email' });
  }

  // Passport appelle validate() avec les champs extraits du corps de la requête
  // Si null est retourné, Passport lève automatiquement une 401
  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;  // Stocké dans req.user et transmis au contrôleur
  }
}
