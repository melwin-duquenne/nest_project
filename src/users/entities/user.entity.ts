// Entité TypeORM User — représente la table "users" en base de données
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enum/user.enum';

@Entity('users')
export class User {
  // Identifiant unique généré automatiquement au format UUID
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  // select:false = ce champ est EXCLU par défaut de toutes les requêtes find()
  // Pour le récupérer, il faut une requête QueryBuilder avec .addSelect('user.passwordHash')
  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ length: 100 })
  name!: string;

  // Rôle avec valeur par défaut MEMBER — stocké comme ENUM en PostgreSQL
  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role!: UserRole;

  // Relation many-to-many avec Team via la table de jonction team_members
  @ManyToMany('Team', 'members')
  teams!: any[];

  // Remplies automatiquement par TypeORM à la création / mise à jour
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
