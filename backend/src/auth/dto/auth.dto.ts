import { IsEmail, IsString, MinLength, IsOptional, IsMobilePhone } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@vsn-ci.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'motdepasse123' })
  @IsString()
  @MinLength(6)
  motDePasse: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsString()
  userId: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(6)
  ancienMotDePasse: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  nouveauMotDePasse: string;
}
