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
