import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Vue d\'ensemble du dashboard selon le rôle de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Statistiques globales' })
  @ApiQuery({ name: 'agenceId', required: false })
  getOverview(
    @CurrentUser('role') role: string,
    @CurrentUser('agenceId') agenceId: string,
    @Query('agenceId') agenceIdQuery?: string,
  ) {
    const effectiveAgenceId = agenceIdQuery ?? agenceId;
    return this.dashboardService.getOverview(role, effectiveAgenceId);
  }

  @Get('graphique')
  @ApiOperation({ summary: 'Graphique des transactions et volumes des 7 derniers jours' })
  @ApiResponse({ status: 200, description: 'Données pour graphique 7 jours' })
  @ApiQuery({ name: 'agenceId', required: false })
  getGraphique(
    @CurrentUser('agenceId') agenceId: string,
    @Query('agenceId') agenceIdQuery?: string,
  ) {
    const effectiveAgenceId = agenceIdQuery ?? agenceId;
    return this.dashboardService.getGraphique7Jours(effectiveAgenceId);
  }

  @Get('top-agences')
  @ApiOperation({ summary: 'Top agences par volume du mois en cours' })
  @ApiResponse({ status: 200, description: 'Classement des agences' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTopAgences(@Query('limit') limit?: string) {
    return this.dashboardService.getTopAgences(limit ? parseInt(limit, 10) : 5);
  }
}
