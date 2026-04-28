// Module WebSocket — fournit le gateway de notifications à toute l'application
// Importe AuthModule pour accéder à JwtService (vérification des tokens à la connexion)
import { Module } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],          // AuthModule exporte JwtModule → JwtService disponible
  providers: [NotificationsGateway],
  exports: [NotificationsGateway], // Exporté pour que TasksService puisse l'injecter
})
export class NotificationsModule {}
