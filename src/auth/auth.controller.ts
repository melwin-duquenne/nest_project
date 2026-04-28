// Contrôleur d'authentification — expose POST /api/auth/login et GET /api/auth/me
import {
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  // Route publique (pas de JWT requis) — Passport intercepte la requête avec LocalStrategy
  // avant d'arriver ici : valide email/password et injecte req.user si succès
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Se connecter et obtenir un token JWT' })
  @ApiBody({ type: LoginDto })  // Nécessaire car Passport intercepte avant le contrôleur
  @ApiOkResponse({ description: 'Connexion réussie, token JWT retourné' })
  @ApiUnauthorizedResponse({ description: 'Email ou mot de passe invalide' })
  login(
    @Request()
    req: {
      user: { id: string; email: string; name: string; role: string };
    },
  ) {
    // req.user a été rempli par LocalStrategy.validate() si les credentials sont corrects
    return this.authService.login(req.user);
  }

  // Route protégée — renvoie le profil complet de l'utilisateur connecté
  // @CurrentUser() extrait l'utilisateur du token JWT déjà validé par JwtAuthGuard
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Récupérer le profil de l'utilisateur connecté" })
  @ApiOkResponse({ description: 'Profil retourné' })
  @ApiUnauthorizedResponse({ description: 'Token manquant ou invalide' })
  me(@CurrentUser() user: { id: string; email: string; role: string }) {
    return this.usersService.findOne(user.id);
  }
}
