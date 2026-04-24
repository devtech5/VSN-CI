import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeContrat } from '@prisma/client';

export class CreateAgentDto {
  @ApiProperty({ example: 'uuid-user-xxxx', description: 'ID de l\'utilisateur à associer' })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'uuid-agence-xxxx', description: 'ID de l\'agence d\'affectation' })
  @IsNotEmpty()
  @IsUUID()
  agenceId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Date d\'embauche (ISO 8601)' })
  @IsNotEmpty()
  @IsDateString()
  dateEmbauche: string;

  @ApiPropertyOptional({ example: 150000, description: 'Salaire mensuel en XOF' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  salaire?: number;

  @ApiProperty({ enum: TypeContrat, example: TypeContrat.CDI, description: 'Type de contrat' })
  @IsNotEmpty()
  @IsEnum(TypeContrat)
  typeContrat: TypeContrat;

  @ApiPropertyOptional({ example: 1.5, description: 'Taux de commission en pourcentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  commission?: number;
}

export class UpdateAgentDto extends PartialType(CreateAgentDto) {}

export class AffecterAgentDto {
  @ApiProperty({ example: 'uuid-agence-xxxx', description: 'ID de la nouvelle agence d\'affectation' })
  @IsNotEmpty()
  @IsUUID()
  agenceId: string;
}
