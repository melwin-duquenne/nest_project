// Helper de test E2E — crée et configure une instance de l'application pour les tests
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';

// Crée une application NestJS complète avec la même config que la prod (sauf la BDD de test)
// AppModule lit .env.test quand NODE_ENV=test → base de données isolée
export async function createTestApp(): Promise<{
  app: INestApplication;
  dataSource: DataSource;
}> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();
  // DataSource TypeORM exposé pour nettoyer/inspecter la BDD dans les tests
  const dataSource = app.get(DataSource);
  return { app, dataSource };
}

// Vide toutes les tables entre chaque test pour garantir l'isolation
// CASCADE supprime aussi les enregistrements liés par clé étrangère
export async function cleanDatabase(dataSource: DataSource) {
  await dataSource.query('TRUNCATE TABLE team_members CASCADE');
  await dataSource.query('TRUNCATE TABLE comments CASCADE');
  await dataSource.query('TRUNCATE TABLE tasks CASCADE');
  await dataSource.query('TRUNCATE TABLE projects CASCADE');
  await dataSource.query('TRUNCATE TABLE teams CASCADE');
  await dataSource.query('TRUNCATE TABLE users CASCADE');
}
