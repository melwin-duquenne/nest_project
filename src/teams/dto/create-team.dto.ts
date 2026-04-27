import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({
    example: 'Équipe Backend',
    description: "Nom de l'équipe (max 100 caractères)",
  })
  @IsString()
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères' })
  name: string;

  @ApiPropertyOptional({
    example: 'Équipe en charge du développement backend',
    description: "Description de l'équipe (max 500 caractères)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'La description ne doit pas dépasser 500 caractères',
  })
  description?: string;
}
