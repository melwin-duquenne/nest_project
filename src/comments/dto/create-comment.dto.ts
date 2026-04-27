import { IsString, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({
    example: "Le module d'auth est prêt pour la review.",
    description: 'Contenu du commentaire (max 1000 caractères)',
  })
  @IsString()
  @MaxLength(1000, {
    message: 'Le contenu ne doit pas dépasser 1000 caractères',
  })
  content: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID de la tâche concernée',
  })
  @IsUUID('4', { message: 'taskId doit être un UUID v4 valide' })
  taskId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: "UUID de l'auteur du commentaire",
  })
  @IsUUID('4', { message: 'authorId doit être un UUID v4 valide' })
  authorId: string;
}
