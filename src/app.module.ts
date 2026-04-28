// Module racine de l'application — importe et assemble tous les autres modules
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { CommentsModule } from './comments/comments.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Charge les variables d'environnement depuis .env (ou .env.test en mode test)
    // isGlobal:true = accessible partout sans réimporter ConfigModule
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    }),

    // Connexion PostgreSQL via TypeORM, configurée dynamiquement depuis les variables d'env
    // En mode test : synchronize+dropSchema recréent le schéma à chaque lancement (base propre)
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        database: config.get<string>('DB_NAME', 'taskflow'),
        username: config.get<string>('DB_USER', 'taskflow'),
        password: config.get<string>('DB_PASSWORD', 'taskflow'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'test',
        dropSchema: config.get('NODE_ENV') === 'test',
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        logging: false,
      }),
    }),

    PrismaModule,         // Client Prisma (accès alternatif à la BDD)
    NotificationsModule,  // WebSocket Socket.io pour les notifications temps réel
    HealthModule,         // Endpoint GET /api/health pour vérifier l'état de la BDD
    UsersModule,
    TeamsModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
    AuthModule,           // Authentification JWT + guards globaux
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
