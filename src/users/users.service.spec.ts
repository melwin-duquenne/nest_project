import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed') }));
import { User } from './entities/user.entity';
import { UserRole } from './enum/user.enum';
import { createMockRepository } from '../common/helpers/mock-repository.helper';

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof createMockRepository<User>>;

  const mockUser: User = {
    id: '11111111-0000-0000-0000-000000000001',
    email: 'alice@test.com',
    name: 'Alice',
    role: UserRole.ADMIN,
    passwordHash: '$2b$10$hash',
    teams: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repo = createMockRepository<User>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it("retourne un tableau d'utilisateurs", async () => {
      repo.find.mockResolvedValue([mockUser]);

      const result = await service.findAll();

      expect(result).toEqual([mockUser]);
      expect(repo.find).toHaveBeenCalledTimes(1);
    });

    it('retourne un tableau vide si aucun utilisateur', async () => {
      repo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it("retourne l'utilisateur quand il existe", async () => {
      repo.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it("lève NotFoundException quand l'utilisateur est introuvable", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    const dto = {
      email: 'bob@test.com',
      name: 'Bob',
      password: 'P@ssw0rd!',
      role: UserRole.MEMBER,
    };

    it('crée et retourne un utilisateur', async () => {
      const newUser = { ...mockUser, email: dto.email, name: dto.name };
      repo.findOne
        .mockResolvedValueOnce(null)     // findByEmail : pas de doublon
        .mockResolvedValueOnce(newUser as User); // findOne après save
      repo.create.mockReturnValue(newUser as User);
      repo.save.mockResolvedValue(newUser as User);

      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newUser);
    });

    it("lève ConflictException si l'email existe déjà", async () => {
      repo.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({ ...dto, email: mockUser.email }),
      ).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it("supprime l'utilisateur existant", async () => {
      repo.findOne.mockResolvedValue(mockUser);
      repo.remove.mockResolvedValue(mockUser);

      await expect(service.remove(mockUser.id)).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalledWith(mockUser);
    });

    it("lève NotFoundException si l'utilisateur n'existe pas", async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('id-inexistant')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
