import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, FilterUserDto, UpdateUserDto } from './dto/rh.dto';

@Injectable()
export class RhService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FilterUserDto) {
    const { role, statut, agenceId, search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) where.role = role;
    if (statut) where.statut = statut;
    if (agenceId) where.agenceId = agenceId;

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
          agenceId: true,
          agence: { select: { id: true, nom: true, code: true } },
          agentProfil: {
            select: {
              id: true,
              matricule: true,
              statut: true,
              solde: true,
              typeContrat: true,
              dateEmbauche: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
        agence: { select: { id: true, nom: true, code: true, ville: true } },
        agentProfil: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur #${id} introuvable`);
    }

    return user;
  }

  async create(dto: CreateUserDto) {
    const [existingEmail, existingPhone] = await Promise.all([
      this.prisma.user.findUnique({ where: { email: dto.email } }),
      this.prisma.user.findUnique({ where: { telephone: dto.telephone } }),
    ]);

    if (existingEmail) {
      throw new ConflictException(`L'email ${dto.email} est déjà utilisé`);
    }

    if (existingPhone) {
      throw new ConflictException(`Le téléphone ${dto.telephone} est déjà utilisé`);
    }

    const hashedPassword = await bcrypt.hash(dto.motDePasse, 12);

    return this.prisma.user.create({
      data: {
        nom: dto.nom,
        prenom: dto.prenom,
        email: dto.email,
        telephone: dto.telephone,
        motDePasse: hashedPassword,
        role: dto.role,
        agenceId: dto.agenceId,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true,
        createdAt: true,
        agenceId: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`L'email ${dto.email} est déjà utilisé`);
      }
    }

    if (dto.telephone) {
      const existing = await this.prisma.user.findFirst({
        where: { telephone: dto.telephone, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(`Le téléphone ${dto.telephone} est déjà utilisé`);
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.prenom !== undefined && { prenom: dto.prenom }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.telephone !== undefined && { telephone: dto.telephone }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.agenceId !== undefined && { agenceId: dto.agenceId }),
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        role: true,
        statut: true,
        updatedAt: true,
      },
    });
  }

  async toggleStatut(id: string) {
    const user = await this.findOne(id);

    const newStatut = user.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';

    return this.prisma.user.update({
      where: { id },
      data: { statut: newStatut },
      select: { id: true, nom: true, prenom: true, statut: true },
    });
  }

  async suspendre(id: string) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { statut: 'SUSPENDU' },
      select: { id: true, nom: true, prenom: true, statut: true },
    });
  }

  async resetPassword(id: string) {
    await this.findOne(id);

    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789';
    let newPassword = '';
    for (let i = 0; i < 8; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: { motDePasse: hashedPassword },
    });

    return {
      message: 'Mot de passe réinitialisé avec succès',
      nouveauMotDePasse: newPassword,
    };
  }

  async getStatsRH() {
    const [parRole, parStatut] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      this.prisma.user.groupBy({
        by: ['statut'],
        _count: { id: true },
      }),
    ]);

    const total = parStatut.reduce((sum, s) => sum + s._count.id, 0);

    return {
      total,
      parRole: parRole.map((r) => ({ role: r.role, count: r._count.id })),
      parStatut: parStatut.map((s) => ({ statut: s.statut, count: s._count.id })),
    };
  }
}
