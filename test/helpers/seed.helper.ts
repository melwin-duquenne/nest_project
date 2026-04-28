// Helper de seed — insère des utilisateurs de test connus avant chaque test E2E
// Appelé dans beforeEach() après cleanDatabase() pour repartir d'un état défini
import { DataSource } from 'typeorm';
import { User } from '../../src/users/entities/user.entity';
import { UserRole } from '../../src/users/enum/user.enum';
import * as bcrypt from 'bcrypt';

export async function seedTestUsers(dataSource: DataSource) {
  const repo = dataSource.getRepository(User);
  // Coût bcrypt réduit à 10 (vs 12 en prod) pour accélérer les tests
  const hash = await bcrypt.hash('password123', 10);

  // Crée un admin et un member avec des credentials prévisibles pour les tests
  const admin = await repo.save(
    repo.create({ email: 'admin@test.com', name: 'Admin Test', role: UserRole.ADMIN, passwordHash: hash }),
  );
  const member = await repo.save(
    repo.create({ email: 'member@test.com', name: 'Member Test', role: UserRole.MEMBER, passwordHash: hash }),
  );

  return { admin, member };
}
