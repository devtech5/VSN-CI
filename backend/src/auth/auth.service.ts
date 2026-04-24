import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import dayjs from 'dayjs';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { LoginDto, VerifyOtpDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  // ─── Génère un code OTP à 6 chiffres ──────────────────────────────────────
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // ─── LOGIN : vérifie email/mdp, génère OTP ────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Identifiants incorrects');

    if (user.statut !== 'ACTIF') {
      throw new ForbiddenException('Compte inactif ou suspendu');
    }

    const mdpValide = await bcrypt.compare(dto.motDePasse, user.motDePasse);
    if (!mdpValide) throw new UnauthorizedException('Identifiants incorrects');

    // Vérifier si OTP est activé
    const params = await this.prisma.parametreSecurite.findFirst();
    if (params?.otpActif) {
      // Générer et stocker OTP
      const code = this.generateOtp();
      const expiresMin = params.dureeOtpMinutes || 5;

      await this.prisma.otp.create({
        data: {
          code: await bcrypt.hash(code, 10),
          expiresAt: dayjs().add(expiresMin, 'minute').toDate(),
          userId: user.id,
        },
      });

      // En production : envoyer via SMS (Africa's Talking)
      // await this.smsService.send(user.telephone, `Votre code VSN-CI : ${code}`)
      console.log(`[OTP] Code pour ${user.email}: ${code}`); // DEV ONLY

      return {
        otpRequis: true,
        userId: user.id,
        message: `Code OTP envoyé au ${user.telephone.slice(0, 4)}***`,
      };
    }

    // Pas d'OTP : connexion directe
    return this.genererTokens(user);
  }

  // ─── VÉRIFICATION OTP ─────────────────────────────────────────────────────
  async verifyOtp(dto: VerifyOtpDto) {
    const otps = await this.prisma.otp.findMany({
      where: { userId: dto.userId, utilisé: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otps.length) throw new BadRequestException('Aucun OTP en attente');

    const otp = otps[0];

    if (dayjs().isAfter(otp.expiresAt)) {
      throw new BadRequestException('Code OTP expiré');
    }

    const codeValide = await bcrypt.compare(dto.code, otp.code);
    if (!codeValide) throw new BadRequestException('Code OTP incorrect');

    // Marquer OTP comme utilisé
    await this.prisma.otp.update({ where: { id: otp.id }, data: { utilisé: true } });

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    return this.genererTokens(user);
  }

  // ─── GÉNÉRER ACCESS + REFRESH TOKENS ──────────────────────────────────────
  private async genererTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN', '7d'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    // Stocker refresh token dans Redis
    await this.redis.set(`refresh:${user.id}`, refreshToken, 30 * 24 * 3600);

    // Mettre à jour dernierLogin
    await this.prisma.user.update({
      where: { id: user.id },
      data: { dernierLogin: new Date() },
    });

    return {
      otpRequis: false,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────────
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const stored = await this.redis.get(`refresh:${payload.sub}`);
      if (stored !== refreshToken) throw new UnauthorizedException('Token invalide');

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      return this.genererTokens(user);
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

  // ─── DÉCONNEXION ──────────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.redis.del(`refresh:${userId}`);
    return { message: 'Déconnexion réussie' };
  }

  // ─── CHANGER MOT DE PASSE ─────────────────────────────────────────────────
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const valid = await bcrypt.compare(dto.ancienMotDePasse, user.motDePasse);
    if (!valid) throw new BadRequestException('Ancien mot de passe incorrect');

    const hash = await bcrypt.hash(dto.nouveauMotDePasse, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { motDePasse: hash } });
    return { message: 'Mot de passe modifié avec succès' };
  }

  // ─── PROFIL COURANT ───────────────────────────────────────────────────────
  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, nom: true, prenom: true, email: true,
        telephone: true, role: true, statut: true, avatar: true,
        dernierLogin: true, agence: { select: { id: true, nom: true, code: true } },
      },
    });
  }
}
