// Factory de mock Repository — remplace le vrai TypeORM Repository dans les tests unitaires
// Chaque méthode est un jest.fn() que les tests peuvent configurer avec .mockResolvedValue()
import { Repository } from 'typeorm';

export const createMockRepository = <T extends object>(): jest.Mocked<
  Pick<
    Repository<T>,
    'find' | 'findOne' | 'findOneBy' | 'save' | 'create' | 'remove' | 'count'
  >
> => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
});
