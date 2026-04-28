// Service utilisateurs (TypeORM) — CRUD complet avec règles métier
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { UserRole } from './enum/user.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  // Retourne tous les utilisateurs sans passwordHash (select:false sur l'entité)
  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // Recherche par UUID — lève 404 si inexistant
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  // Variante spéciale qui inclut passwordHash — uniquement pour la validation du login
  // QueryBuilder nécessaire car passwordHash a select:false dans l'entité
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(dto: CreateUserDto): Promise<User> {
    this.logger.log(`Création d'un utilisateur : ${dto.email}`);
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Vérifie l'unicité de l'email avant d'insérer
    const existing = await this.findByEmail(normalizedEmail);
    if (existing)
      throw new ConflictException(`Email ${normalizedEmail} already in use`);

    // Hachage bcrypt avec un coût de 12 (recommandé pour la sécurité)
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepository.create({
      email: normalizedEmail,
      name: dto.name,
      role: dto.role,
      passwordHash,
    });

    const saved = await this.usersRepository.save(user);
    // Re-fetch via findOne pour retourner l'entité sans passwordHash (select:false)
    // save() retourne l'objet en mémoire qui contient encore le hash
    return this.findOne(saved.id);
  }

  // Un utilisateur peut modifier son propre profil, un admin peut modifier n'importe qui
  async update(
    id: string,
    dto: UpdateUserDto,
    currentUser: { id: string; role: UserRole },
  ): Promise<User> {
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    const user = await this.findOne(id);

    // Si l'email change, vérifie qu'il n'est pas déjà pris par un autre compte
    if (dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      if (normalizedEmail !== user.email) {
        const existing = await this.findByEmail(normalizedEmail);
        if (existing)
          throw new ConflictException(`Email ${normalizedEmail} already in use`);
      }
      dto.email = normalizedEmail;
    }
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    this.logger.warn(`Suppression de l'utilisateur : ${id}`);
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}
