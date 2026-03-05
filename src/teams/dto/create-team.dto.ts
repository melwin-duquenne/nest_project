import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères' })
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'La description ne doit pas dépasser 500 caractères',
  })
  description?: string;
}
