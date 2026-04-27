import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@ApiTags('teams')
@ApiBearerAuth('JWT-auth')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une équipe' })
  @ApiResponse({ status: 201, description: 'Équipe créée' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  create(@Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(createTeamDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lister toutes les équipes' })
  @ApiResponse({ status: 200, description: 'Liste des équipes' })
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Récupérer une équipe par ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Équipe trouvée' })
  @ApiResponse({ status: 400, description: 'UUID invalide' })
  @ApiResponse({ status: 404, description: 'Équipe introuvable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mettre à jour une équipe' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Équipe mise à jour' })
  @ApiResponse({
    status: 400,
    description: 'UUID invalide ou données invalides',
  })
  @ApiResponse({ status: 404, description: 'Équipe introuvable' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, updateTeamDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une équipe' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Équipe supprimée' })
  @ApiResponse({ status: 400, description: 'UUID invalide' })
  @ApiResponse({ status: 404, description: 'Équipe introuvable' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.teamsService.remove(id);
  }

  @Post(':id/members')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ajouter un membre à une équipe' })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: "ID de l'équipe",
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { userId: { type: 'string', format: 'uuid' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Membre ajouté' })
  @ApiResponse({ status: 400, description: 'UUID invalide' })
  @ApiResponse({
    status: 404,
    description: 'Équipe ou utilisateur introuvable',
  })
  @ApiResponse({ status: 409, description: 'Utilisateur déjà membre' })
  addMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.teamsService.addMember(id, userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Retirer un membre d'une équipe" })
  @ApiParam({
    name: 'id',
    type: 'string',
    format: 'uuid',
    description: "ID de l'équipe",
  })
  @ApiParam({
    name: 'userId',
    type: 'string',
    format: 'uuid',
    description: "ID de l'utilisateur",
  })
  @ApiResponse({ status: 200, description: 'Membre retiré' })
  @ApiResponse({ status: 400, description: 'UUID invalide' })
  @ApiResponse({ status: 404, description: 'Équipe introuvable' })
  removeMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.teamsService.removeMember(id, userId);
  }
}
