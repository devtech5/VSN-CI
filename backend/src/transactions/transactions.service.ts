import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, FilterTransactionDto } from './dto/transaction.dto';
import { StatutTransaction } from '@prisma/client';

const FRAIS_TAUX = 0.02; // 2%
const FRAIS_MINIMUM = 50; // 50 XOF
const SEUIL_VALIDATION_AUTO = 500000; // 500 000 XOF

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  private calculerFrais(montant: number): number {
    const fraisCalcules = montant * FRAIS_TAUX;
    return Math.max(fraisCalcules, FRAIS_MINIMUM);
  }

  private genererReference(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.getTime().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `TXN-${date}-${time}-${rand}`;
  }

  private buildWhereClause(query: FilterTransactionDto) {
    const where: any = {};

    if (query.agenceId) where.agenceId = query.agenceId;
    if (query.agentId) where.operateurId = query.agentId;
    if (query.reseauId) where.reseauId = query.reseauId;
    if (query.type) where.type = query.type;
    if (query.statut) where.statut = query.statut;

    if (query.dateDebut || query.dateFin) {
      where.createdAt = {};
      if (query.dateDebut) where.createdAt.gte = new Date(query.dateDebut);
      if (query.dateFin) {
        const fin = new Date(query.dateFin);
        fin.setHours(23, 59, 59, 999);
        where.createdAt.lte = fin;
      }
    }

    return where;
  }

  async findAll(query: FilterTransactionDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = this.buildWhereClause(query);

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          reseau: { select: { id: true, nom: true, type: true, couleur: true } },
          agence: { select: { id: true, nom: true, code: true, ville: true } },
          agent: { select: { id: true, nom: true, prenom: true, email: true } },
          operateur: {
            select: {
              id: true,
              matricule: true,
              user: { select: { nom: true, prenom: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        reseau: { select: { id: true, nom: true, type: true, couleur: true } },
        agence: { select: { id: true, nom: true, code: true, ville: true } },
        agent: { select: { id: true, nom: true, prenom: true, email: true } },
        operateur: {
          select: {
            id: true,
            matricule: true,
            user: { select: { nom: true, prenom: true } },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction avec l'id "${id}" introuvable`);
    }

    return transaction;
  }

  async create(dto: CreateTransactionDto, agentId: string) {
    const agence = await this.prisma.agence.findUnique({
      where: { id: dto.agenceId },
    });
    if (!agence) {
      throw new NotFoundException(`Agence avec l'id "${dto.agenceId}" introuvable`);
    }

    const reseau = await this.prisma.reseau.findUnique({
      where: { id: dto.reseauId },
    });
    if (!reseau) {
      throw new NotFoundException(`Réseau avec l'id "${dto.reseauId}" introuvable`);
    }

    const userAgent = await this.prisma.user.findUnique({
      where: { id: agentId },
      include: { agentProfil: true },
    });
    if (!userAgent) {
      throw new NotFoundException(`Agent introuvable`);
    }

    const frais = this.calculerFrais(dto.montant);
    const montantNet = dto.montant - frais;
    const reference = this.genererReference();

    const statutInitial: StatutTransaction =
      dto.montant > SEUIL_VALIDATION_AUTO
        ? StatutTransaction.EN_ATTENTE
        : StatutTransaction.VALIDEE;

    const transaction = await this.prisma.transaction.create({
      data: {
        reference,
        type: dto.type,
        montant: dto.montant,
        frais,
        montantNet,
        numeroClient: dto.numeroClient,
        nomClient: dto.nomClient,
        description: dto.description,
        statut: statutInitial,
        reseauId: dto.reseauId,
        agenceId: dto.agenceId,
        agentId,
        operateurId: userAgent.agentProfil?.id ?? null,
        valideeAt: statutInitial === StatutTransaction.VALIDEE ? new Date() : null,
      },
      include: {
        reseau: { select: { id: true, nom: true, type: true } },
        agence: { select: { id: true, nom: true, code: true } },
        agent: { select: { id: true, nom: true, prenom: true } },
      },
    });

    if (statutInitial === StatutTransaction.VALIDEE) {
      await this.prisma.agence.update({
        where: { id: dto.agenceId },
        data: { solde: { increment: montantNet } },
      });
    }

    return transaction;
  }

  async valider(id: string) {
    const transaction = await this.findOne(id);

    if (transaction.statut !== StatutTransaction.EN_ATTENTE) {
      throw new BadRequestException(
        `Impossible de valider une transaction en statut "${transaction.statut}"`,
      );
    }

    const [transactionMisAJour] = await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id },
        data: {
          statut: StatutTransaction.VALIDEE,
          valideeAt: new Date(),
        },
      }),
      this.prisma.agence.update({
        where: { id: transaction.agenceId },
        data: { solde: { increment: transaction.montantNet } },
      }),
    ]);

    return transactionMisAJour;
  }

  async annuler(id: string) {
    const transaction = await this.findOne(id);

    if (
      transaction.statut === StatutTransaction.ANNULEE ||
      transaction.statut === StatutTransaction.ECHOUEE
    ) {
      throw new BadRequestException(
        `Impossible d'annuler une transaction en statut "${transaction.statut}"`,
      );
    }

    const operations: any[] = [
      this.prisma.transaction.update({
        where: { id },
        data: { statut: StatutTransaction.ANNULEE },
      }),
    ];

    if (transaction.statut === StatutTransaction.VALIDEE) {
      operations.push(
        this.prisma.agence.update({
          where: { id: transaction.agenceId },
          data: { solde: { decrement: transaction.montantNet } },
        }),
      );
    }

    const [transactionMisAJour] = await this.prisma.$transaction(operations);
    return transactionMisAJour;
  }

  async getStats(query: { agenceId?: string; dateDebut?: string; dateFin?: string }) {
    const where: any = { statut: StatutTransaction.VALIDEE };

    if (query.agenceId) where.agenceId = query.agenceId;

    if (query.dateDebut || query.dateFin) {
      where.createdAt = {};
      if (query.dateDebut) where.createdAt.gte = new Date(query.dateDebut);
      if (query.dateFin) {
        const fin = new Date(query.dateFin);
        fin.setHours(23, 59, 59, 999);
        where.createdAt.lte = fin;
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      select: {
        montant: true,
        frais: true,
        montantNet: true,
        type: true,
        reseauId: true,
        reseau: { select: { nom: true, type: true } },
      },
    });

    const volumeTotal = transactions.reduce((sum, tx) => sum + tx.montant, 0);
    const totalFrais = transactions.reduce((sum, tx) => sum + tx.frais, 0);
    const nbTransactions = transactions.length;

    const parType = transactions.reduce(
      (acc, tx) => {
        if (!acc[tx.type]) acc[tx.type] = { nb: 0, volume: 0, frais: 0 };
        acc[tx.type].nb += 1;
        acc[tx.type].volume += tx.montant;
        acc[tx.type].frais += tx.frais;
        return acc;
      },
      {} as Record<string, { nb: number; volume: number; frais: number }>,
    );

    const reseauxMap = new Map<string, { nom: string; type: string; nb: number; volume: number }>();
    for (const tx of transactions) {
      if (tx.reseauId && tx.reseau) {
        const existing = reseauxMap.get(tx.reseauId) || {
          nom: tx.reseau.nom,
          type: tx.reseau.type,
          nb: 0,
          volume: 0,
        };
        existing.nb += 1;
        existing.volume += tx.montant;
        reseauxMap.set(tx.reseauId, existing);
      }
    }

    return {
      volumeTotal,
      totalFrais,
      nbTransactions,
      parType,
      parReseau: Array.from(reseauxMap.entries()).map(([reseauId, data]) => ({
        reseauId,
        ...data,
      })),
    };
  }

  async getJournal(query: FilterTransactionDto) {
    const result = await this.findAll(query);

    const where = this.buildWhereClause(query);
    const totaux = await this.prisma.transaction.aggregate({
      where: { ...where, statut: StatutTransaction.VALIDEE },
      _sum: { montant: true, frais: true, montantNet: true },
      _count: { id: true },
    });

    return {
      ...result,
      totaux: {
        volumeTotal: totaux._sum.montant ?? 0,
        totalFrais: totaux._sum.frais ?? 0,
        totalNet: totaux._sum.montantNet ?? 0,
        nbTransactionsValidees: totaux._count.id,
      },
    };
  }
}
