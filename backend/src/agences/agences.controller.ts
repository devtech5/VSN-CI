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
import { AgencesService } from './agences.service';
import { ApprovisionnementDto, CreateAgenceDto, UpdateAgenceDto } from './dto/agence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Agences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('agences')
export class AgencesController {
  constructor(private readonly agencesService: AgencesService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Lister toutes les agences' })
  @ApiQuery({ name: 'ville', required: false, description: 'Filtrer par ville' })
  @ApiQuery({ name: 'statut', required: false, description: 'Filtrer par statut (ACTIVE, INACTIVE, SUSPENDUE)' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche sur nom, code ou ville' })
  @ApiResponse({ status: 200, description: 'Liste des agences retournée avec succès' })
  findAll(
    @Query('ville') ville?: string,
    @Query('statut') statut?: string,
    @Query('search') search?: string,
  ) {
    return this.agencesService.findAll({ ville, statut, search });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Obtenir le détail d\'une agence' })
  @ApiResponse({ status: 200, description: 'Détail de l\'agence retourné avec succès' })
  @ApiResponse({ status: 404, description: 'Agence introuvable' })
  findOne(@Param('id') id: string) {
    return this.agencesService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer une nouvelle agence' })
  @ApiResponse({ status: 201, description: 'Agence créée avec succès' })
  @ApiResponse({ status: 409, description: 'Code agence déjà utilisé' })
  create(@Body() dto: CreateAgenceDto) {
    return this.agencesService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Modifier une agence' })
  @ApiResponse({ status: 200, description: 'Agence modifiée avec succès' })
  @ApiResponse({ status: 404, description: 'Agence introuvable' })
  update(@Param('id') id: string, @Body() dto: UpdateAgenceDto) {
    return this.agencesService.update(id, dto);
  }

  @Patch(':id/statut')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Basculer le statut d\'une agence (ACTIVE ↔ INACTIVE)' })
  @ApiResponse({ status: 200, description: 'Statut modifié avec succès' })
  @ApiResponse({ status: 404, description: 'Agence introuvable' })
  toggleStatut(@Param('id') id: string) {
    return this.agencesService.toggleStatut(id);
  }

  @Post(':id/approvisionner')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Approvisionner le solde d\'une agence' })
  @ApiResponse({ status: 201, description: 'Approvisionnement effectué avec succès' })
  @ApiResponse({ status: 404, description: 'Agence introuvable' })
  approvisionner(@Param('id') id: string, @Body() dto: ApprovisionnementDto) {
    return this.agencesService.approvisionner(id, dto);
  }

  @Get(':id/stats')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Obtenir les statistiques d\'une agence' })
  @ApiResponse({ status: 200, description: 'Statistiques retournées avec succès' })
  @ApiResponse({ status: 404, description: 'Agence introuvable' })
  getStats(@Param('id') id: string) {
    return this.agencesService.getStats(id);
  }
}
