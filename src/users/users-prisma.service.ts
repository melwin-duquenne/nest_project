// Service utilisateurs via Prisma — implémentation alternative du CRUD avec Prisma ORM
// Même logique métier que UsersService (TypeORM) mais avec le client Prisma
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

// Sélection explicite des champs retournés — exclut toujours passwordHash des réponses
const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  passwordHash: false,
} as const;

@Injectable()
export class UsersPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async create(dto: CreateUserDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // findUnique est plus performant que findFirst pour une contrainte unique
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) throw new ConflictException(`Email ${normalizedEmail} already in use`);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    // select:USER_SELECT dans create() évite de re-fetcher après l'insertion
    return this.prisma.user.create({
      data: {
        email: normalizedEmail,
        name: dto.name,
        role: dto.role,
        passwordHash,
      },
      select: USER_SELECT,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);  // Lève 404 si l'utilisateur n'existe pas

    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      const existing = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      // Autorise si c'est le même utilisateur qui conserve son email
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email ${normalizedEmail} already in use`);
      }
      dto = { ...dto, email: normalizedEmail };
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: USER_SELECT,
    });
  }

  async remove(id: string) {
    await this.findOne(id);  // Lève 404 si l'utilisateur n'existe pas
    await this.prisma.user.delete({ where: { id } });
  }
}
