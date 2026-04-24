import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  Min,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN_AGENCE = 'ADMIN_AGENCE',
  AGENT = 'AGENT',
  CAISSIER = 'CAISSIER',
}

export class CreateUserDto {
  @ApiProperty({ description: 'Nom de l\'utilisateur' })
  @IsString()
  nom: string;

  @ApiProperty({ description: 'Prénom de l\'utilisateur' })
  @IsString()
  prenom: string;

  @ApiProperty({ description: 'Adresse email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Numéro de téléphone' })
  @IsString()
  telephone: string;

  @ApiProperty({ description: 'Mot de passe (min 6 caractères)', minLength: 6 })
  @IsString()
  @MinLength(6)
  motDePasse: string;

  @ApiProperty({ enum: Role, description: 'Rôle de l\'utilisateur' })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ description: 'Identifiant de l\'agence' })
  @IsOptional()
  @IsString()
  agenceId?: string;
}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['motDePasse'] as const)) {}

export class FilterUserDto {
  @ApiPropertyOptional({ enum: Role, description: 'Filtrer par rôle' })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Filtrer par statut' })
  @IsOptional()
  @IsString()
  statut?: string;

  @ApiPropertyOptional({ description: 'Filtrer par agence' })
  @IsOptional()
  @IsString()
  agenceId?: string;

  @ApiPropertyOptional({ description: 'Recherche textuelle (nom, prénom, email)' })
  @IsOptional()
  @IsString()
  search?: string;

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
