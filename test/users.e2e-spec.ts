import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, cleanDatabase } from './helpers/app.helper';
import { seedTestUsers } from './helpers/seed.helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createTestApp());
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    await seedTestUsers(dataSource);

    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = adminRes.body.access_token as string;

    const memberRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: 'password123' });
    memberToken = memberRes.body.access_token as string;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  it('GET /api/users → 200 + liste non vide', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/users → 401 sans token', async () => {
    const res = await request(app.getHttpServer()).get('/api/users');

    expect(res.status).toBe(401);
  });

  it('POST /api/users → 201 par admin', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@test.com', name: 'Nouveau', password: 'P@ssword1' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('POST /api/users → 400 email invalide', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'pas-un-email', name: 'Test', password: 'P@ssword1' });

    expect(res.status).toBe(400);
  });

  it('POST /api/users → 403 par member (non admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: 'new@test.com', name: 'Nouveau', password: 'P@ssword1' });

    expect(res.status).toBe(403);
  });

  it('Cycle complet : créer → récupérer → supprimer', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'cycle@test.com', name: 'Cycle User', password: 'P@ssword1' });

    expect(createRes.status).toBe(201);
    const id = createRes.body.id as string;

    const getRes = await request(app.getHttpServer())
      .get(`/api/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(id);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(204);

    const notFoundRes = await request(app.getHttpServer())
      .get(`/api/users/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(notFoundRes.status).toBe(404);
  });
});
