import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { RhService } from './rh.service';
import { CreateUserDto, FilterUserDto, UpdateUserDto } from './dto/rh.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('RH - Ressources Humaines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rh')
export class RhController {
  constructor(private readonly rhService: RhService) {}

  @Get('users')
  @ApiOperation({ summary: 'Lister tous les utilisateurs avec filtres et pagination' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs' })
  findAll(@Query() query: FilterUserDto) {
    return this.rhService.findAll(query);
  }

  @Get('users/stats')
  @ApiOperation({ summary: 'Statistiques RH (par rôle et statut)' })
  @ApiResponse({ status: 200, description: 'Statistiques RH' })
  getStats() {
    return this.rhService.getStatsRH();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Détail d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Détail de l\'utilisateur' })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  findOne(@Param('id') id: string) {
    return this.rhService.findOne(id);
  }

  @Post('users')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Créer un nouvel utilisateur (SUPER_ADMIN uniquement)' })
  @ApiResponse({ status: 201, description: 'Utilisateur créé' })
  create(@Body() dto: CreateUserDto) {
    return this.rhService.create(dto);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur mis à jour' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.rhService.update(id, dto);
  }

  @Patch('users/:id/statut')
  @ApiOperation({ summary: 'Basculer le statut ACTIF/INACTIF d\'un utilisateur' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  toggleStatut(@Param('id') id: string) {
    return this.rhService.toggleStatut(id);
  }

  @Patch('users/:id/suspendre')
  @ApiOperation({ summary: 'Suspendre un utilisateur' })
  @ApiResponse({ status: 200, description: 'Utilisateur suspendu' })
  suspendre(@Param('id') id: string) {
    return this.rhService.suspendre(id);
  }

  @Patch('users/:id/reset-password')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe (SUPER_ADMIN uniquement)' })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé — retourne le nouveau mot de passe en clair' })
  resetPassword(@Param('id') id: string) {
    return this.rhService.resetPassword(id);
  }
}
