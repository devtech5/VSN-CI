import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export enum TypeReseau {
  WAVE = 'WAVE',
  MTN = 'MTN',
  ORANGE = 'ORANGE',
  MOOV = 'MOOV',
  AUTRE = 'AUTRE',
}

export class CreateReseauDto {
  @ApiProperty({ description: 'Nom du réseau' })
  @IsString()
  nom: string;

  @ApiProperty({ enum: TypeReseau, description: 'Type de réseau mobile' })
  @IsEnum(TypeReseau)
  type: TypeReseau;

  @ApiPropertyOptional({ description: 'Couleur hexadécimale du réseau', default: '#000000' })
  @IsOptional()
  @IsString()
  couleur?: string;

  @ApiPropertyOptional({
    description: 'Taux de commission en pourcentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxCommission?: number;
}

export class UpdateReseauDto extends PartialType(CreateReseauDto) {}

export class CreateCompteReseauDto {
  @ApiProperty({ description: 'Identifiant du réseau' })
  @IsString()
  reseauId: string;

  @ApiProperty({ description: 'Identifiant de l\'agence' })
  @IsString()
  agenceId: string;

  @ApiProperty({ description: 'Numéro du compte réseau' })
  @IsString()
  numero: string;
}
