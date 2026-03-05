import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

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
  @IsString()
  @MaxLength(200, { message: 'Le titre ne doit pas dépasser 200 caractères' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message: 'La description ne doit pas dépasser 2000 caractères',
  })
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus, {
    message: `Le statut doit être l'un de : ${Object.values(TaskStatus).join(', ')}`,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority, {
    message: `La priorité doit être l'une de : ${Object.values(TaskPriority).join(', ')}`,
  })
  priority?: TaskPriority;

  @IsUUID('4', { message: 'projectId doit être un UUID v4 valide' })
  projectId: string;

  @IsOptional()
  @IsUUID('4', { message: 'assigneeId doit être un UUID v4 valide' })
  assigneeId?: string;
}
