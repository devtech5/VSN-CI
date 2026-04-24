import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeTransaction, StatutTransaction } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ enum: TypeTransaction, example: TypeTransaction.DEPOT, description: 'Type de transaction' })
  @IsNotEmpty()
  @IsEnum(TypeTransaction)
  type: TypeTransaction;

  @ApiProperty({ example: 25000, description: 'Montant de la transaction en XOF' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  montant: number;

  @ApiProperty({ example: 'uuid-reseau-xxxx', description: 'ID du réseau/opérateur' })
  @IsNotEmpty()
  @IsUUID()
  reseauId: string;

  @ApiProperty({ example: 'uuid-agence-xxxx', description: 'ID de l\'agence' })
  @IsNotEmpty()
  @IsUUID()
  agenceId: string;

  @ApiProperty({ example: '+2250700000000', description: 'Numéro de téléphone du client' })
  @IsNotEmpty()
  @IsString()
  numeroClient: string;

  @ApiPropertyOptional({ example: 'Koné Mamadou', description: 'Nom du client' })
  @IsOptional()
  @IsString()
  nomClient?: string;

  @ApiPropertyOptional({ example: 'Paiement facture eau', description: 'Description de la transaction' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class FilterTransactionDto {
  @ApiPropertyOptional({ example: 'uuid-agence-xxxx', description: 'Filtrer par agence' })
  @IsOptional()
  @IsUUID()
  agenceId?: string;

  @ApiPropertyOptional({ example: 'uuid-agent-xxxx', description: 'Filtrer par agent (opérateur)' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiPropertyOptional({ example: 'uuid-reseau-xxxx', description: 'Filtrer par réseau' })
  @IsOptional()
  @IsUUID()
  reseauId?: string;

  @ApiPropertyOptional({ enum: TypeTransaction, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(TypeTransaction)
  type?: TypeTransaction;

  @ApiPropertyOptional({ enum: StatutTransaction, description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(StatutTransaction)
  statut?: StatutTransaction;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Date de début (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ example: '2024-01-31', description: 'Date de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ example: 1, description: 'Numéro de page', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, description: 'Nombre d\'éléments par page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

export class ValiderTransactionDto {
  @ApiProperty({ example: 'uuid-transaction-xxxx', description: 'ID de la transaction à valider' })
  @IsNotEmpty()
  @IsUUID()
  transactionId: string;
}
