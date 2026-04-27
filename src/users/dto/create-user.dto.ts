import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../enum/user.enum';

export class CreateUserDto {
  @ApiProperty({
    example: 'alice@taskflow.dev',
    description: 'Adresse email unique',
  })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiProperty({
    example: 'Alice Dupont',
    description: 'Nom complet (2-100 caractères)',
  })
  @IsString()
  @MinLength(2, { message: 'Le nom doit faire au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne doit pas dépasser 100 caractères' })
  name: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.MEMBER,
    description: "Rôle de l'utilisateur",
  })
  @IsEnum(UserRole, {
    message: `Le rôle doit être l'un de : ${Object.values(UserRole).join(', ')}`,
  })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description:
      'Mot de passe (min 8 car., majuscule, minuscule, chiffre, caractère spécial)',
    writeOnly: true,
  })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit faire au moins 8 caractères' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/, {
    message:
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
  })
  password: string;
}
