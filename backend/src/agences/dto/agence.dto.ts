import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAgenceDto {
  @ApiProperty({ example: 'AGC-ABJ-001', description: 'Code unique de l\'agence' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiProperty({ example: 'Agence Plateau', description: 'Nom de l\'agence' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nom: string;

  @ApiProperty({ example: '12 Boulevard de la République', description: 'Adresse physique' })
  @IsNotEmpty()
  @IsString()
  adresse: string;

  @ApiProperty({ example: 'Abidjan', description: 'Ville de l\'agence' })
  @IsNotEmpty()
  @IsString()
  ville: string;

  @ApiProperty({ example: '+2250700000000', description: 'Numéro de téléphone' })
  @IsNotEmpty()
  @IsString()
  telephone: string;

  @ApiPropertyOptional({ example: 'agence.plateau@vsn-ci.com', description: 'Adresse email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 5.3599, description: 'Latitude GPS' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  latitude?: number;

  @ApiPropertyOptional({ example: -4.0083, description: 'Longitude GPS' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  longitude?: number;
}

export class UpdateAgenceDto extends PartialType(CreateAgenceDto) {}

export class ApprovisionnementDto {
  @ApiProperty({ example: 500000, description: 'Montant de l\'approvisionnement en XOF' })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  montant: number;

  @ApiPropertyOptional({ example: 'Approvisionnement mensuel', description: 'Description de l\'opération' })
  @IsOptional()
  @IsString()
  description?: string;
}
