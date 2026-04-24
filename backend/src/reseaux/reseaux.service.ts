import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompteReseauDto, CreateReseauDto, UpdateReseauDto } from './dto/reseau.dto';

@Injectable()
export class ReseauxService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.reseau.findMany({
      where: { actif: true },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: string) {
    const reseau = await this.prisma.reseau.findUnique({
      where: { id },
      include: {
        comptesReseau: {
          include: {
            agence: { select: { id: true, nom: true, code: true } },
          },
        },
      },
    });

    if (!reseau) {
      throw new NotFoundException(`Réseau #${id} introuvable`);
    }

    return reseau;
  }

  async create(dto: CreateReseauDto) {
    return this.prisma.reseau.create({
      data: {
        nom: dto.nom,
        type: dto.type,
        couleur: dto.couleur ?? '#000000',
        tauxCommission: dto.tauxCommission ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateReseauDto) {
    await this.findOne(id);

    return this.prisma.reseau.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined && { nom: dto.nom }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.couleur !== undefined && { couleur: dto.couleur }),
        ...(dto.tauxCommission !== undefined && { tauxCommission: dto.tauxCommission }),
      },
    });
  }

  async toggleActif(id: string) {
    const reseau = await this.prisma.reseau.findUnique({ where: { id } });
    if (!reseau) {
      throw new NotFoundException(`Réseau #${id} introuvable`);
    }

    return this.prisma.reseau.update({
      where: { id },
      data: { actif: !reseau.actif },
      select: { id: true, nom: true, type: true, actif: true },
    });
  }

  async createCompte(dto: CreateCompteReseauDto) {
    const [reseau, agence] = await Promise.all([
      this.prisma.reseau.findUnique({ where: { id: dto.reseauId } }),
      this.prisma.agence.findUnique({ where: { id: dto.agenceId } }),
    ]);

    if (!reseau) throw new NotFoundException(`Réseau #${dto.reseauId} introuvable`);
    if (!agence) throw new NotFoundException(`Agence #${dto.agenceId} introuvable`);

    const existing = await this.prisma.compteReseau.findUnique({
      where: { reseauId_agenceId: { reseauId: dto.reseauId, agenceId: dto.agenceId } },
    });

    if (existing) {
      throw new ConflictException('Un compte réseau existe déjà pour cette agence et ce réseau');
    }

    return this.prisma.compteReseau.create({
      data: {
        reseauId: dto.reseauId,
        agenceId: dto.agenceId,
        numero: dto.numero,
      },
      include: {
        reseau: { select: { id: true, nom: true, type: true, couleur: true } },
        agence: { select: { id: true, nom: true, code: true } },
      },
    });
  }

  async getComptesParAgence(agenceId: string) {
    const agence = await this.prisma.agence.findUnique({ where: { id: agenceId } });
    if (!agence) throw new NotFoundException(`Agence #${agenceId} introuvable`);

    return this.prisma.compteReseau.findMany({
      where: { agenceId },
      include: {
        reseau: { select: { id: true, nom: true, type: true, couleur: true, logo: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getSoldeTotal() {
    const comptes = await this.prisma.compteReseau.groupBy({
      by: ['reseauId'],
      _sum: { solde: true },
    });

    const reseaux = await this.prisma.reseau.findMany({
      where: { id: { in: comptes.map((c) => c.reseauId) } },
      select: { id: true, nom: true, type: true, couleur: true },
    });

    const reseauxMap = Object.fromEntries(reseaux.map((r) => [r.id, r]));

    const totalGeneral = comptes.reduce((sum, c) => sum + (c._sum.solde ?? 0), 0);

    return {
      totalGeneral,
      parReseau: comptes.map((c) => ({
        reseau: reseauxMap[c.reseauId],
        soldeTotal: c._sum.solde ?? 0,
      })),
    };
  }
}
