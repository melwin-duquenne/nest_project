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
    // TODO: retourner tous les utilisateurs
  }

  findOne(id: string): User {
    // TODO: trouver l'utilisateur par id
    // Lever NotFoundException si introuvable
  }

  findByEmail(email: string): User | undefined {
    // TODO: trouver l'utilisateur par email (peut retourner undefined)
  }

  create(dto: CreateUserDto): User {
    // TODO:
    // 1. Vérifier qu'aucun utilisateur n'a déjà cet email (ConflictException sinon)
    // 2. Créer un objet User avec randomUUID(), les champs du dto, et les dates
    // 3. Ajouter à this.users et retourner le nouvel utilisateur
  }

  update(id: string, dto: UpdateUserDto): User {
    // TODO:
    // 1. Récupérer l'utilisateur (findOne lève déjà 404)
    // 2. Si l'email change, vérifier qu'il n'est pas déjà pris (ConflictException)
    // 3. Mettre à jour les champs et updatedAt, retourner l'utilisateur
  }

  remove(id: string): void {
    // TODO: supprimer l'utilisateur du tableau (NotFoundException si introuvable)
  }
}