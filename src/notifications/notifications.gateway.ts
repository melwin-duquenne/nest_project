// Gateway WebSocket — gère les connexions Socket.io temps réel avec authentification JWT
// Namespace /notifications → les clients se connectent à ws://localhost:3000/notifications
import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

// Structure du payload décodé depuis le token JWT
interface JwtPayload { sub: string; email: string; role: string; }

@Injectable()
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  // Instance du serveur Socket.io — utilisée pour émettre des événements vers des rooms
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  // Appelée automatiquement à chaque nouvelle connexion WebSocket
  // Vérifie le token JWT et place le client dans sa room personnelle "user:<id>"
  handleConnection(client: Socket) {
    // Accepte le token depuis auth.token (Socket.io) ou le header Authorization (HTTP upgrade)
    const token =
      (client.handshake.auth as { token?: string }).token ||
      client.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`Connexion refusée (pas de token) : ${client.id}`);
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      // Stocke les infos utilisateur dans le socket pour usage ultérieur
      client.data = { user: payload };
      // Chaque utilisateur rejoint sa room privée — seul lui reçoit ses notifications
      void client.join(`user:${payload.sub}`);
      this.logger.log(`Client connecté : ${client.id} → user:${payload.sub}`);
    } catch {
      this.logger.warn(`Token invalide : ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client déconnecté : ${client.id}`);
  }

  // Événement émis par le client pour s'abonner aux notifications d'un projet
  // Le client rejoint la room "project:<id>" et reçoit les futurs événements de ce projet
  @SubscribeMessage('join:project')
  handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() projectId: string,
  ) {
    void client.join(`project:${projectId}`);
    this.logger.log(`${client.id} a rejoint project:${projectId}`);
    return { joined: projectId };
  }

  // Envoie un événement à un utilisateur spécifique via sa room privée
  // Appelé par TasksService lors d'une nouvelle assignation
  sendToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Envoie un événement à tous les membres connectés d'un projet
  sendToProject(projectId: string, event: string, data: unknown) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }
}
