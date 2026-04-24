import {
  IsString,
  IsEnum,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum TypeDepense {
  LOYER = 'LOYER',
  SALAIRE = 'SALAIRE',
  FOURNITURES = 'FOURNITURES',
  TRANSPORT = 'TRANSPORT',
  COMMUNICATION = 'COMMUNICATION',
  AUTRE = 'AUTRE',
}

export class CreateDepenseDto {
  @ApiProperty({ description: 'Libellé de la dépense' })
  @IsString()
  libelle: string;

  @ApiProperty({ enum: TypeDepense, description: 'Type de dépense' })
  @IsEnum(TypeDepense)
  type: TypeDepense;

  @ApiProperty({ description: 'Montant de la dépense (positif)', minimum: 0 })
  @IsNumber()
  @IsPositive()
  montant: number;

  @ApiProperty({ description: 'Identifiant de l\'agence' })
  @IsString()
  agenceId: string;

  @ApiPropertyOptional({ description: 'Description optionnelle' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Date de la dépense (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateDepense?: string;
}

export class UpdateDepenseDto extends PartialType(CreateDepenseDto) {}

export class FilterDepenseDto {
  @ApiPropertyOptional({ description: 'Filtrer par agence' })
  @IsOptional()
  @IsString()
  agenceId?: string;

  @ApiPropertyOptional({ enum: TypeDepense, description: 'Filtrer par type' })
  @IsOptional()
  @IsEnum(TypeDepense)
  type?: TypeDepense;

  @ApiPropertyOptional({ description: 'Filtrer par statut' })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateDebut?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFin?: string;

  @ApiPropertyOptional({ description: 'Numéro de page', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Nombre d\'éléments par page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
