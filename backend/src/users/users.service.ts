import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface UpdateProfileDto {
  nom?: string;
  prenom?: string;
  avatar?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true,
        avatar: true,
        dernierLogin: true,
        createdAt: true,
        updatedAt: true,
        agenceId: true,
        agence: {
          select: {
            id: true,
            nom: true,
            code: true,
            ville: true,
            adresse: true,
            telephone: true,
            statut: true,
          },
        },
        agentProfil: {
          select: {
            id: true,
            matricule: true,
            statut: true,
            solde: true,
            soldeFlottant: true,
            typeContrat: true,
            dateEmbauche: true,
            commission: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${userId} introuvable`);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    await this.getProfile(userId);

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.prenom !== undefined && { prenom: data.prenom }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true,
        avatar: true,
        updatedAt: true,
      },
    });
  }
}
