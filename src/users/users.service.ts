import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserRole } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  private users: User[] = [];

  findAll(): User[] {
    return this.users;
  }

  findOne(id: string): User {
    const user = this.users.find((u) => u.id === id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }

  create(dto: CreateUserDto): User {
    if (this.findByEmail(dto.email)) {
      throw new ConflictException(`Email ${dto.email} already in use`);
    }
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      email: dto.email,
      name: dto.name,
      role: dto.role ?? UserRole.MEMBER,
      createdAt: now,
      updatedAt: now,
    };
    this.users.push(user);
    return user;
  }

  update(id: string, dto: UpdateUserDto): User {
    const user = this.findOne(id);
    if (dto.email && dto.email !== user.email) {
      if (this.findByEmail(dto.email)) {
        throw new ConflictException(`Email ${dto.email} already in use`);
      }
      user.email = dto.email;
    }
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.role !== undefined) user.role = dto.role;
    user.updatedAt = new Date();
    return user;
  }

  remove(id: string): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) throw new NotFoundException(`User #${id} not found`);
    this.users.splice(index, 1);
  }
}
