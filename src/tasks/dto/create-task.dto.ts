import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export class CreateTaskDto {
  @ApiProperty({
    example: "Implémenter l'authentification JWT",
    description: 'Titre de la tâche (max 200 caractères)',
  })
  @IsString()
  @MaxLength(200, { message: 'Le titre ne doit pas dépasser 200 caractères' })
  title: string;

  @ApiPropertyOptional({
    example: 'Mettre en place LocalStrategy et JwtStrategy avec NestJS',
    description: 'Description détaillée (max 2000 caractères)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La description ne doit pas dépasser 2000 caractères',
  })
  description?: string;

  @ApiPropertyOptional({
    enum: TaskStatus,
    default: TaskStatus.TODO,
    description: 'Statut de la tâche',
  })
  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `Le statut doit être l'un de : ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;

  @ApiPropertyOptional({
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    description: 'Priorité de la tâche',
  })
  @IsOptional()
  @IsEnum(TaskPriority, {
    message: `La priorité doit être l'une de : ${Object.values(TaskPriority).join(', ')}`,
  })
  priority?: TaskPriority;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID du projet parent',
  })
  @IsUUID('4', { message: 'projectId doit être un UUID v4 valide' })
  projectId: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: "UUID de l'utilisateur assigné",
  })
  @IsOptional()
  @IsUUID('4', { message: 'assigneeId doit être un UUID v4 valide' })
  assigneeId?: string;
}
