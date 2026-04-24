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
import { FinanceService } from './finance.service';
import { CreateDepenseDto, FilterDepenseDto, UpdateDepenseDto } from './dto/finance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('depenses')
  @ApiOperation({ summary: 'Lister toutes les dépenses avec filtres et pagination' })
  @ApiResponse({ status: 200, description: 'Liste des dépenses' })
  findAll(
    @Query() query: FilterDepenseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.findAllDepenses(query, userId);
  }

  @Get('depenses/resume')
  @ApiOperation({ summary: 'Résumé financier des dépenses' })
  @ApiResponse({ status: 200, description: 'Résumé financier' })
  getResume(@Query('agenceId') agenceId?: string) {
    return this.financeService.getResumeFinancier(agenceId);
  }

  @Get('depenses/budget-mensuel')
  @ApiOperation({ summary: 'Budget mensuel des 12 derniers mois' })
  @ApiResponse({ status: 200, description: 'Budget par mois' })
  getBudgetMensuel(@Query('agenceId') agenceId?: string) {
    return this.financeService.getBudgetMensuel(agenceId);
  }

  @Get('depenses/:id')
  @ApiOperation({ summary: 'Détail d\'une dépense' })
  @ApiResponse({ status: 200, description: 'Détail de la dépense' })
  @ApiResponse({ status: 404, description: 'Dépense introuvable' })
  findOne(@Param('id') id: string) {
    return this.financeService.findOneDepense(id);
  }

  @Post('depenses')
  @ApiOperation({ summary: 'Créer une nouvelle dépense' })
  @ApiResponse({ status: 201, description: 'Dépense créée' })
  create(
    @Body() dto: CreateDepenseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.createDepense(dto, userId);
  }

  @Patch('depenses/:id')
  @ApiOperation({ summary: 'Modifier une dépense' })
  @ApiResponse({ status: 200, description: 'Dépense mise à jour' })
  update(@Param('id') id: string, @Body() dto: UpdateDepenseDto) {
    return this.financeService.updateDepense(id, dto);
  }

  @Patch('depenses/:id/approuver')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Approuver une dépense' })
  @ApiResponse({ status: 200, description: 'Dépense approuvée' })
  approuver(@Param('id') id: string) {
    return this.financeService.approuverDepense(id);
  }

  @Patch('depenses/:id/rejeter')
  @ApiOperation({ summary: 'Rejeter une dépense' })
  @ApiResponse({ status: 200, description: 'Dépense rejetée' })
  rejeter(@Param('id') id: string) {
    return this.financeService.rejeterDepense(id);
  }

  @Patch('depenses/:id/payer')
  @ApiOperation({ summary: 'Marquer une dépense comme payée et déduire du solde agence' })
  @ApiResponse({ status: 200, description: 'Dépense payée' })
  payer(@Param('id') id: string) {
    return this.financeService.payerDepense(id);
  }
}
