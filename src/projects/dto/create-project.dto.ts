import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
}

export class CreateProjectDto {
  @IsString()
  @MaxLength(200, { message: 'Le nom ne doit pas dépasser 200 caractères' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'La description ne doit pas dépasser 1000 caractères',
  })
  description?: string;

  @IsOptional()
  @IsEnum(ProjectStatus, {
    message: `Le statut doit être l'un de : ${Object.values(ProjectStatus).join(', ')}`,
  })
  status?: ProjectStatus;

  @IsUUID('4', { message: 'teamId doit être un UUID v4 valide' })
  teamId: string;
}
