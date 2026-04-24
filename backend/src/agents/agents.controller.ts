import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { AffecterAgentDto, CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Lister tous les agents' })
  @ApiQuery({ name: 'agenceId', required: false, description: 'Filtrer par agence' })
  @ApiQuery({ name: 'statut', required: false, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche sur matricule, nom, email...' })
  @ApiResponse({ status: 200, description: 'Liste des agents retournée avec succès' })
  findAll(
    @Query('agenceId') agenceId?: string,
    @Query('statut') statut?: string,
    @Query('search') search?: string,
  ) {
    return this.agentsService.findAll({ agenceId, statut, search });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Obtenir le détail d\'un agent' })
  @ApiResponse({ status: 200, description: 'Détail de l\'agent retourné' })
  @ApiResponse({ status: 404, description: 'Agent introuvable' })
  findOne(@Param('id') id: string) {
    return this.agentsService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer un nouvel agent' })
  @ApiResponse({ status: 201, description: 'Agent créé avec succès' })
  @ApiResponse({ status: 404, description: 'Utilisateur ou agence introuvable' })
  @ApiResponse({ status: 409, description: 'Profil agent déjà existant pour cet utilisateur' })
  create(@Body() dto: CreateAgentDto) {
    return this.agentsService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Modifier un agent' })
  @ApiResponse({ status: 200, description: 'Agent modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Agent introuvable' })
  update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    return this.agentsService.update(id, dto);
  }

  @Patch(':id/affecter')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Affecter un agent à une autre agence' })
  @ApiResponse({ status: 200, description: 'Agent affecté avec succès' })
  @ApiResponse({ status: 404, description: 'Agent ou agence introuvable' })
  affecter(@Param('id') id: string, @Body() dto: AffecterAgentDto) {
    return this.agentsService.affecter(id, dto);
  }

  @Patch(':id/statut')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Basculer le statut d\'un agent (ACTIF ↔ INACTIF)' })
  @ApiResponse({ status: 200, description: 'Statut modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Agent introuvable' })
  toggleStatut(@Param('id') id: string) {
    return this.agentsService.toggleStatut(id);
  }

  @Get(':id/solde')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT')
  @ApiOperation({ summary: 'Obtenir le solde d\'un agent' })
  @ApiResponse({ status: 200, description: 'Solde retourné avec succès' })
  @ApiResponse({ status: 404, description: 'Agent introuvable' })
  getSolde(@Param('id') id: string) {
    return this.agentsService.getSolde(id);
  }

  @Get(':id/performance')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT')
  @ApiOperation({ summary: 'Obtenir les performances du mois d\'un agent' })
  @ApiResponse({ status: 200, description: 'Performances retournées avec succès' })
  @ApiResponse({ status: 404, description: 'Agent introuvable' })
  getPerformance(@Param('id') id: string) {
    return this.agentsService.getPerformance(id);
  }
}
