import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, FilterTransactionDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER')
  @ApiOperation({ summary: 'Lister les transactions avec pagination et filtres' })
  @ApiQuery({ name: 'agenceId', required: false })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiQuery({ name: 'reseauId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['DEPOT', 'RETRAIT', 'TRANSFERT', 'PAIEMENT', 'RECHARGEMENT', 'REMBOURSEMENT'] })
  @ApiQuery({ name: 'statut', required: false, enum: ['EN_ATTENTE', 'VALIDEE', 'ECHOUEE', 'ANNULEE', 'REMBOURSEE'] })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Liste paginée des transactions' })
  findAll(@Query() query: FilterTransactionDto) {
    return this.transactionsService.findAll(query);
  }

  @Get('stats')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Obtenir les statistiques globales des transactions' })
  @ApiQuery({ name: 'agenceId', required: false })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiResponse({ status: 200, description: 'Statistiques retournées avec succès' })
  getStats(
    @Query('agenceId') agenceId?: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.transactionsService.getStats({ agenceId, dateDebut, dateFin });
  }

  @Get('journal')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE', 'CAISSIER')
  @ApiOperation({ summary: 'Journal des transactions avec totaux' })
  @ApiQuery({ name: 'agenceId', required: false })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiQuery({ name: 'reseauId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'statut', required: false })
  @ApiQuery({ name: 'dateDebut', required: false })
  @ApiQuery({ name: 'dateFin', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Journal avec totaux retourné' })
  getJournal(@Query() query: FilterTransactionDto) {
    return this.transactionsService.getJournal(query);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER')
  @ApiOperation({ summary: 'Obtenir le détail d\'une transaction' })
  @ApiResponse({ status: 200, description: 'Transaction retournée avec succès' })
  @ApiResponse({ status: 404, description: 'Transaction introuvable' })
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER')
  @ApiOperation({ summary: 'Créer une nouvelle transaction' })
  @ApiResponse({ status: 201, description: 'Transaction créée avec succès' })
  @ApiResponse({ status: 404, description: 'Agence ou réseau introuvable' })
  create(@Body() dto: CreateTransactionDto, @Request() req: any) {
    return this.transactionsService.create(dto, req.user.id);
  }

  @Patch(':id/valider')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Valider une transaction en attente' })
  @ApiResponse({ status: 200, description: 'Transaction validée avec succès' })
  @ApiResponse({ status: 400, description: 'La transaction ne peut pas être validée' })
  @ApiResponse({ status: 404, description: 'Transaction introuvable' })
  valider(@Param('id') id: string) {
    return this.transactionsService.valider(id);
  }

  @Patch(':id/annuler')
  @Roles('SUPER_ADMIN', 'ADMIN_AGENCE')
  @ApiOperation({ summary: 'Annuler une transaction' })
  @ApiResponse({ status: 200, description: 'Transaction annulée avec succès' })
  @ApiResponse({ status: 400, description: 'La transaction ne peut pas être annulée' })
  @ApiResponse({ status: 404, description: 'Transaction introuvable' })
  annuler(@Param('id') id: string) {
    return this.transactionsService.annuler(id);
  }
}
