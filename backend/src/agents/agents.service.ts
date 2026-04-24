import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AffecterAgentDto, CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { StatutAgent } from '@prisma/client';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  private async genererMatricule(): Promise<string> {
    const annee = new Date().getFullYear();
    const prefix = `AGT-${annee}-`;

    const dernierAgent = await this.prisma.agent.findFirst({
      where: { matricule: { startsWith: prefix } },
      orderBy: { matricule: 'desc' },
    });

    let sequence = 1;
    if (dernierAgent) {
      const parts = dernierAgent.matricule.split('-');
      const dernierNumero = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(dernierNumero)) {
        sequence = dernierNumero + 1;
      }
    }

    const numeroFormate = String(sequence).padStart(4, '0');
    return `${prefix}${numeroFormate}`;
  }

  async findAll(query: { agenceId?: string; statut?: string; search?: string }) {
    const { agenceId, statut, search } = query;

    const where: any = {};

    if (agenceId) {
      where.agenceId = agenceId;
    }

    if (statut) {
      where.statut = statut as StatutAgent;
    }

    if (search) {
      where.OR = [
        { matricule: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { prenom: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { telephone: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return this.prisma.agent.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            statut: true,
            avatar: true,
            role: true,
          },
        },
        agence: {
          select: { id: true, nom: true, code: true, ville: true },
        },
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true,
            statut: true,
            avatar: true,
            role: true,
            dernierLogin: true,
          },
        },
        agence: {
          select: { id: true, nom: true, code: true, ville: true, adresse: true, statut: true },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent avec l'id "${id}" introuvable`);
    }

    return agent;
  }

  async create(dto: CreateAgentDto) {
    const userExistant = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!userExistant) {
      throw new NotFoundException(`Utilisateur avec l'id "${dto.userId}" introuvable`);
    }

    const agentExistant = await this.prisma.agent.findUnique({
      where: { userId: dto.userId },
    });

    if (agentExistant) {
      throw new ConflictException(`Cet utilisateur possède déjà un profil agent`);
    }

    const agenceExistante = await this.prisma.agence.findUnique({
      where: { id: dto.agenceId },
    });

    if (!agenceExistante) {
      throw new NotFoundException(`Agence avec l'id "${dto.agenceId}" introuvable`);
    }

    const matricule = await this.genererMatricule();

    return this.prisma.agent.create({
      data: {
        matricule,
        userId: dto.userId,
        agenceId: dto.agenceId,
        dateEmbauche: new Date(dto.dateEmbauche),
        salaire: dto.salaire,
        typeContrat: dto.typeContrat,
        commission: dto.commission ?? 0,
      },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, email: true, telephone: true },
        },
        agence: {
          select: { id: true, nom: true, code: true, ville: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateAgentDto) {
    await this.findOne(id);

    if (dto.agenceId) {
      const agenceExistante = await this.prisma.agence.findUnique({
        where: { id: dto.agenceId },
      });
      if (!agenceExistante) {
        throw new NotFoundException(`Agence avec l'id "${dto.agenceId}" introuvable`);
      }
    }

    const { userId, ...dataToUpdate } = dto;

    return this.prisma.agent.update({
      where: { id },
      data: {
        ...dataToUpdate,
        dateEmbauche: dto.dateEmbauche ? new Date(dto.dateEmbauche) : undefined,
      },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        agence: {
          select: { id: true, nom: true, code: true, ville: true },
        },
      },
    });
  }

  async affecter(id: string, dto: AffecterAgentDto) {
    await this.findOne(id);

    const agenceExistante = await this.prisma.agence.findUnique({
      where: { id: dto.agenceId },
    });

    if (!agenceExistante) {
      throw new NotFoundException(`Agence avec l'id "${dto.agenceId}" introuvable`);
    }

    return this.prisma.agent.update({
      where: { id },
      data: { agenceId: dto.agenceId },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        agence: {
          select: { id: true, nom: true, code: true, ville: true },
        },
      },
    });
  }

  async toggleStatut(id: string) {
    const agent = await this.findOne(id);

    const nouveauStatut =
      agent.statut === StatutAgent.ACTIF ? StatutAgent.INACTIF : StatutAgent.ACTIF;

    return this.prisma.agent.update({
      where: { id },
      data: { statut: nouveauStatut },
    });
  }

  async getSolde(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      select: {
        id: true,
        matricule: true,
        solde: true,
        soldeFlottant: true,
        user: {
          select: { nom: true, prenom: true },
        },
      },
    });

    if (!agent) {
      throw new NotFoundException(`Agent avec l'id "${id}" introuvable`);
    }

    return {
      id: agent.id,
      matricule: agent.matricule,
      nom: `${agent.user.prenom} ${agent.user.nom}`,
      solde: agent.solde,
      soldeFlottant: agent.soldeFlottant,
      soldeTotal: agent.solde + agent.soldeFlottant,
    };
  }

  async getPerformance(id: string) {
    await this.findOne(id);

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);

    const finMois = new Date(debutMois.getFullYear(), debutMois.getMonth() + 1, 0, 23, 59, 59, 999);

    const agent = await this.prisma.agent.findUnique({
      where: { id },
      select: { userId: true, commission: true },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        operateurId: id,
        createdAt: { gte: debutMois, lte: finMois },
        statut: 'VALIDEE',
      },
      select: { montant: true, frais: true, type: true },
    });

    const nbTransactions = transactions.length;
    const volumeTotal = transactions.reduce((sum, tx) => sum + tx.montant, 0);
    const totalFrais = transactions.reduce((sum, tx) => sum + tx.frais, 0);

    const parType = transactions.reduce(
      (acc, tx) => {
        if (!acc[tx.type]) acc[tx.type] = { nb: 0, volume: 0 };
        acc[tx.type].nb += 1;
        acc[tx.type].volume += tx.montant;
        return acc;
      },
      {} as Record<string, { nb: number; volume: number }>,
    );

    const commissionEstimee = (volumeTotal * (agent?.commission ?? 0)) / 100;

    return {
      mois: debutMois.toISOString().slice(0, 7),
      nbTransactions,
      volumeTotal,
      totalFrais,
      commissionEstimee,
      parType,
    };
  }
}
