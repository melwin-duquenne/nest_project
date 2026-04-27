import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'alice@taskflow.dev', description: 'Adresse email' })
  email: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'Mot de passe',
    writeOnly: true,
  })
  password: string;
}
