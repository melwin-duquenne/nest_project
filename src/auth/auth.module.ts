// Module d'authentification — configure JWT, Passport et applique les guards globalement
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './decorators/strategies/local.strategy';
import { JwtStrategy } from './decorators/strategies/jwt.strategy';
import { JwtAuthGuard } from './decorators/guards/jwt-auth.guard';
import { RolesGuard } from './decorators/guards/roles.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,     // Nécessaire pour vérifier email/mot de passe lors du login
    PassportModule,  // Framework Passport pour les stratégies d'authentification

    // Configure le module JWT avec la clé secrète et la durée d'expiration du token
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '24h') as `${number}${'s'|'m'|'h'|'d'}` },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,  // Stratégie email/password pour POST /auth/login
    JwtStrategy,    // Stratégie JWT pour valider le token sur les routes protégées

    // APP_GUARD = garde appliqué globalement à TOUTES les routes de l'application
    // JwtAuthGuard vérifie le token JWT (sauf routes marquées @Public())
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // RolesGuard vérifie le rôle de l'utilisateur (sauf routes sans @Roles())
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  // Exporte JwtModule pour que NotificationsGateway puisse vérifier les tokens WebSocket
  exports: [JwtModule],
})
export class AuthModule {}
