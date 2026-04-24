import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ReseauxService } from './reseaux.service';
import {
  CreateCompteReseauDto,
  CreateReseauDto,
  UpdateReseauDto,
} from './dto/reseau.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Réseaux')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reseaux')
export class ReseauxController {
  constructor(private readonly reseauxService: ReseauxService) {}

  @Get()
  @ApiOperation({ summary: 'Lister tous les réseaux actifs' })
  @ApiResponse({ status: 200, description: 'Liste des réseaux' })
  findAll() {
    return this.reseauxService.findAll();
  }

  @Get('soldes')
  @ApiOperation({ summary: 'Solde total par réseau' })
  @ApiResponse({ status: 200, description: 'Soldes par réseau' })
  getSoldeTotal() {
    return this.reseauxService.getSoldeTotal();
  }

  @Get('comptes/:agenceId')
  @ApiOperation({ summary: 'Comptes réseau d\'une agence avec soldes' })
  @ApiResponse({ status: 200, description: 'Comptes réseau de l\'agence' })
  getComptesParAgence(@Param('agenceId') agenceId: string) {
    return this.reseauxService.getComptesParAgence(agenceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un réseau' })
  @ApiResponse({ status: 200, description: 'Détail du réseau' })
  @ApiResponse({ status: 404, description: 'Réseau introuvable' })
  findOne(@Param('id') id: string) {
    return this.reseauxService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer un nouveau réseau (SUPER_ADMIN uniquement)' })
  @ApiResponse({ status: 201, description: 'Réseau créé' })
  create(@Body() dto: CreateReseauDto) {
    return this.reseauxService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un réseau' })
  @ApiResponse({ status: 200, description: 'Réseau mis à jour' })
  update(@Param('id') id: string, @Body() dto: UpdateReseauDto) {
    return this.reseauxService.update(id, dto);
  }

  @Patch(':id/actif')
  @ApiOperation({ summary: 'Activer/désactiver un réseau' })
  @ApiResponse({ status: 200, description: 'Statut du réseau mis à jour' })
  toggleActif(@Param('id') id: string) {
    return this.reseauxService.toggleActif(id);
  }

  @Post('comptes')
  @ApiOperation({ summary: 'Créer un compte réseau pour une agence' })
  @ApiResponse({ status: 201, description: 'Compte réseau créé' })
  createCompte(@Body() dto: CreateCompteReseauDto) {
    return this.reseauxService.createCompte(dto);
  }
}
