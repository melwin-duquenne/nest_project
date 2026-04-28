// Point d'entrée de l'application NestJS — exécuté au démarrage du serveur
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import helmet from 'helmet';

async function bootstrap() {
  // Crée l'application NestJS avec le moteur Express
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ajoute des headers HTTP de sécurité (anti-XSS, anti-clickjacking, etc.)
  app.use(helmet());

  // Autorise les requêtes cross-origin (utile pour Swagger UI et les clients front-end)
  app.enableCors();

  // Sert les fichiers statiques du dossier /public (ex : favicon, assets HTML)
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Préfixe toutes les routes avec /api (ex : GET /api/users)
  app.setGlobalPrefix('api');

  // Validation automatique de tous les DTOs entrants sur chaque route
  // whitelist : supprime les champs non déclarés dans le DTO
  // forbidNonWhitelisted : renvoie une erreur 400 si un champ inconnu est envoyé
  // transform : convertit automatiquement les types (string → number, etc.)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger UI disponible uniquement hors production à l'URL /docs
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TaskFlow API')
      .setDescription('API RESTful de gestion de projets et tâches')
      .setVersion('1.0')
      // Ajoute le bouton "Authorize" dans Swagger pour tester les routes protégées par JWT
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via POST /api/auth/login',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Authentification')
      .addTag('users', 'Gestion des utilisateurs')
      .addTag('teams', 'Gestion des équipes')
      .addTag('projects', 'Gestion des projets')
      .addTag('tasks', 'Gestion des tâches')
      .addTag('comments', 'Commentaires')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    // persistAuthorization : conserve le token JWT entre les rechargements de page Swagger
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // Filtre global : intercepte toutes les exceptions non gérées et renvoie une réponse JSON propre
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Intercepteur global : logue chaque requête HTTP avec sa durée
  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
