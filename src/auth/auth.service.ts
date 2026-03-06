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

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string; name: string; role: string } | null> {
    const user = await this.usersService.findByEmailWithPassword(email.toLowerCase().trim());
    console.log('DEBUG user found:', user ? user.email : 'null');
    console.log('DEBUG passwordHash:', user?.passwordHash ?? 'undefined');
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('DEBUG isMatch:', isMatch);
    if (!isMatch) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  login(user: { id: string; email: string; name: string; role: string }) {
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
