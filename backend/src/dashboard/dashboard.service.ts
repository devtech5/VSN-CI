import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(role: string, agenceId?: string) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const transactionWhere: any = {
      createdAt: { gte: startOfDay, lt: endOfDay },
    };

    const agenceWhere: any = {};
    const agentWhere: any = {};

    if (agenceId) {
      transactionWhere.agenceId = agenceId;
      agentWhere.agenceId = agenceId;
    }

    if (role === 'SUPER_ADMIN') {
      const [
        nbAgences,
        nbAgents,
        transactionsDuJour,
        soldeTotalResult,
        topAgences,
        repartitionReseau,
        evolution7Jours,
      ] = await Promise.all([
        this.prisma.agence.count({ where: { statut: 'ACTIVE' } }),
        this.prisma.user.count({ where: { role: { in: ['AGENT', 'CAISSIER'] }, statut: 'ACTIF' } }),
        this.prisma.transaction.aggregate({
          where: transactionWhere,
          _count: { id: true },
          _sum: { montant: true },
        }),
        this.prisma.agence.aggregate({ _sum: { solde: true } }),
        this.getTopAgences(5),
        this.getRepartitionReseau(),
        this.getGraphique7Jours(),
      ]);

      return {
        nbAgences,
        nbAgents,
        transactionsDuJour: {
          count: transactionsDuJour._count.id,
          volume: transactionsDuJour._sum.montant ?? 0,
        },
        soldeTotalPlateforme: soldeTotalResult._sum.solde ?? 0,
        topAgences,
        repartitionReseau,
        evolution7Jours,
      };
    }

    // ADMIN_AGENCE / AGENT — filtre par agenceId
    const [nbAgents, transactionsDuJour, soldeAgence, repartitionReseau, evolution7Jours] =
      await Promise.all([
        this.prisma.user.count({
          where: {
            role: { in: ['AGENT', 'CAISSIER'] },
            statut: 'ACTIF',
            ...(agenceId && { agenceId }),
          },
        }),
        this.prisma.transaction.aggregate({
          where: transactionWhere,
          _count: { id: true },
          _sum: { montant: true },
        }),
        agenceId
          ? this.prisma.agence.findUnique({
              where: { id: agenceId },
              select: { solde: true },
            })
          : null,
        this.getRepartitionReseau(agenceId),
        this.getGraphique7Jours(agenceId),
      ]);

    return {
      nbAgents,
      transactionsDuJour: {
        count: transactionsDuJour._count.id,
        volume: transactionsDuJour._sum.montant ?? 0,
      },
      soldeAgence: soldeAgence?.solde ?? 0,
      repartitionReseau,
      evolution7Jours,
    };
  }

  async getGraphique7Jours(agenceId?: string) {
    const result: Array<{ date: string; count: number; volume: number }> = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);

      const where: any = { createdAt: { gte: start, lt: end } };
      if (agenceId) where.agenceId = agenceId;

      const agg = await this.prisma.transaction.aggregate({
        where,
        _count: { id: true },
        _sum: { montant: true },
      });

      result.push({
        date: start.toISOString().split('T')[0],
        count: agg._count.id,
        volume: agg._sum.montant ?? 0,
      });
    }

    return result;
  }

  async getTopAgences(limit: number = 5) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const volumeParAgence = await this.prisma.transaction.groupBy({
      by: ['agenceId'],
      where: { createdAt: { gte: startOfMonth } },
      _sum: { montant: true },
      _count: { id: true },
      orderBy: { _sum: { montant: 'desc' } },
      take: limit,
    });

    const agenceIds = volumeParAgence.map((v) => v.agenceId);
    const agences = await this.prisma.agence.findMany({
      where: { id: { in: agenceIds } },
      select: { id: true, nom: true, code: true, ville: true },
    });

    const agencesMap = Object.fromEntries(agences.map((a) => [a.id, a]));

    return volumeParAgence.map((v) => ({
      agence: agencesMap[v.agenceId],
      volume: v._sum.montant ?? 0,
      nbTransactions: v._count.id,
    }));
  }

  private async getRepartitionReseau(agenceId?: string) {
    const where: any = {};
    if (agenceId) where.agenceId = agenceId;

    const parReseau = await this.prisma.transaction.groupBy({
      by: ['reseauId'],
      where: { ...where, reseauId: { not: null } },
      _sum: { montant: true },
      _count: { id: true },
    });

    const reseauIds = parReseau.map((r) => r.reseauId).filter(Boolean) as string[];
    const reseaux = await this.prisma.reseau.findMany({
      where: { id: { in: reseauIds } },
      select: { id: true, nom: true, type: true, couleur: true },
    });

    const reseauxMap = Object.fromEntries(reseaux.map((r) => [r.id, r]));

    return parReseau.map((r) => ({
      reseau: r.reseauId ? reseauxMap[r.reseauId] : null,
      volume: r._sum.montant ?? 0,
      count: r._count.id,
    }));
  }
}
