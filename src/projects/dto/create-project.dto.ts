import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
}

export class CreateProjectDto {
  @ApiProperty({
    example: 'Refonte API v2',
    description: 'Nom du projet (max 200 caractères)',
  })
  @IsString()
  @MaxLength(200, { message: 'Le nom ne doit pas dépasser 200 caractères' })
  name: string;

  @ApiPropertyOptional({
    example: "Réécriture complète de l'API REST",
    description: 'Description du projet (max 1000 caractères)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000, {
    message: 'La description ne doit pas dépasser 1000 caractères',
  })
  description?: string;

  @ApiPropertyOptional({
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
    description: 'Statut du projet',
  })
  @IsOptional()
  @IsEnum(ProjectStatus, {
    message: `Le statut doit être l'un de : ${Object.values(ProjectStatus).join(', ')}`,
  })
  status?: ProjectStatus;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: "UUID de l'équipe propriétaire",
  })
  @IsUUID('4', { message: 'teamId doit être un UUID v4 valide' })
  teamId: string;
}
