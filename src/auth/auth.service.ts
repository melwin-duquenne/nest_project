// Service d'authentification — vérifie les credentials et génère les tokens JWT
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Appelée par LocalStrategy lors du login : vérifie email + mot de passe
  // Retourne les données publiques de l'utilisateur ou null si les credentials sont invalides
  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; name: string; role: string } | null> {
    // Utilise une requête spéciale qui inclut passwordHash (normalement exclu par select:false)
    const user = await this.usersService.findByEmailWithPassword(email.toLowerCase().trim());
    console.log('DEBUG user found:', user ? user.email : 'null');
    console.log('DEBUG passwordHash:', user?.passwordHash ?? 'undefined');
    if (!user) return null;

    // Compare le mot de passe en clair avec le hash bcrypt stocké en base
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('DEBUG isMatch:', isMatch);
    if (!isMatch) return null;

    // Ne retourne jamais le passwordHash au contrôleur
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  // Génère et retourne le token JWT + les infos publiques de l'utilisateur
  // Appelée par AuthController.login() après validation réussie
  login(user: { id: string; email: string; name: string; role: string }) {
    // payload : données encodées dans le token (récupérables dans JwtStrategy.validate)
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
