import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovisionnementDto, CreateAgenceDto, UpdateAgenceDto } from './dto/agence.dto';
import { StatutAgence } from '@prisma/client';

@Injectable()
export class AgencesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: { ville?: string; statut?: string; search?: string }) {
    const { ville, statut, search } = query;

    const where: any = {};

    if (ville) {
      where.ville = { contains: ville, mode: 'insensitive' };
    }

    if (statut) {
      where.statut = statut as StatutAgence;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { ville: { contains: search, mode: 'insensitive' } },
      ];
    }

    const agences = await this.prisma.agence.findMany({
      where,
      include: {
        _count: {
          select: { agents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return agences.map((agence) => ({
      ...agence,
      nbAgents: agence._count.agents,
      _count: undefined,
    }));
  }

  async findOne(id: string) {
    const agence = await this.prisma.agence.findUnique({
      where: { id },
      include: {
        agents: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, email: true, telephone: true, statut: true },
            },
          },
        },
        responsables: {
          select: { id: true, nom: true, prenom: true, email: true, role: true },
        },
        _count: {
          select: { transactions: true, agents: true },
        },
      },
    });

    if (!agence) {
      throw new NotFoundException(`Agence avec l'id "${id}" introuvable`);
    }

    return agence;
  }

  async create(dto: CreateAgenceDto) {
    const existing = await this.prisma.agence.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Une agence avec le code "${dto.code}" existe déjà`);
    }

    return this.prisma.agence.create({
      data: {
        code: dto.code,
        nom: dto.nom,
        adresse: dto.adresse,
        ville: dto.ville,
        telephone: dto.telephone,
        email: dto.email,
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
    });
  }

  async update(id: string, dto: UpdateAgenceDto) {
    await this.findOne(id);

    if (dto.code) {
      const existing = await this.prisma.agence.findFirst({
        where: { code: dto.code, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`Une agence avec le code "${dto.code}" existe déjà`);
      }
    }

    return this.prisma.agence.update({
      where: { id },
      data: dto,
    });
  }

  async toggleStatut(id: string) {
    const agence = await this.findOne(id);

    const nouveauStatut =
      agence.statut === StatutAgence.ACTIVE
        ? StatutAgence.INACTIVE
        : StatutAgence.ACTIVE;

    return this.prisma.agence.update({
      where: { id },
      data: { statut: nouveauStatut },
    });
  }

  async approvisionner(agenceId: string, dto: ApprovisionnementDto) {
    const agence = await this.findOne(agenceId);

    const [approvisionnement] = await this.prisma.$transaction([
      this.prisma.approvisionnement.create({
        data: {
          montant: dto.montant,
          description: dto.description,
          agenceId,
          valide: true,
          valideAt: new Date(),
        },
      }),
      this.prisma.agence.update({
        where: { id: agenceId },
        data: { solde: agence.solde + dto.montant },
      }),
    ]);

    const agenceMisAJour = await this.prisma.agence.findUnique({
      where: { id: agenceId },
      select: { id: true, nom: true, solde: true },
    });

    return {
      approvisionnement,
      agence: agenceMisAJour,
    };
  }

  async getStats(id: string) {
    await this.findOne(id);

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const finMois = new Date(debutMois.getFullYear(), debutMois.getMonth() + 1, 0, 23, 59, 59, 999);

    const [agence, nbAgents, transactionsMois] = await Promise.all([
      this.prisma.agence.findUnique({
        where: { id },
        select: { solde: true },
      }),
      this.prisma.agent.count({ where: { agenceId: id } }),
      this.prisma.transaction.findMany({
        where: {
          agenceId: id,
          createdAt: { gte: debutMois, lte: finMois },
          statut: 'VALIDEE',
        },
        select: {
          montant: true,
          frais: true,
          montantNet: true,
          reseauId: true,
          type: true,
          reseau: { select: { nom: true, type: true } },
        },
      }),
    ]);

    const reseauxMap = new Map<string, { nom: string; type: string; volume: number; nbTransactions: number }>();
    let volumeTotal = 0;
    let totalFrais = 0;

    for (const tx of transactionsMois) {
      volumeTotal += tx.montant;
      totalFrais += tx.frais;
      if (tx.reseauId && tx.reseau) {
        const existing = reseauxMap.get(tx.reseauId) || {
          nom: tx.reseau.nom,
          type: tx.reseau.type,
          volume: 0,
          nbTransactions: 0,
        };
        existing.volume += tx.montant;
        existing.nbTransactions += 1;
        reseauxMap.set(tx.reseauId, existing);
      }
    }

    return {
      solde: agence?.solde ?? 0,
      nbAgents,
      nbTransactionsMois: transactionsMois.length,
      volumeTotalMois: volumeTotal,
      totalFraisMois: totalFrais,
      volumesParReseau: Array.from(reseauxMap.entries()).map(([reseauId, data]) => ({
        reseauId,
        ...data,
      })),
    };
  }
}
