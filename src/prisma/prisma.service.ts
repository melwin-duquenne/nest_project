// Service Prisma — encapsule PrismaClient dans le cycle de vie NestJS
// Utilise DATABASE_URL depuis les variables d'environnement (lu directement par Prisma)
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  // Ouvre la connexion à la base de données au démarrage du module
  async onModuleInit() {
    await this.$connect();
  }

  // Ferme proprement la connexion quand l'application s'arrête
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
