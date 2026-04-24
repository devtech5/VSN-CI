import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepenseDto, FilterDepenseDto, UpdateDepenseDto } from './dto/finance.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllDepenses(query: FilterDepenseDto, userId: string) {
    const { agenceId, type, statut, dateDebut, dateFin, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (agenceId) where.agenceId = agenceId;
    if (type) where.type = type;
    if (statut) where.statut = statut;

    if (dateDebut || dateFin) {
      where.dateDepense = {};
      if (dateDebut) where.dateDepense.gte = new Date(dateDebut);
      if (dateFin) where.dateDepense.lte = new Date(dateFin);
    }

    const [data, total] = await Promise.all([
      this.prisma.depense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          agence: { select: { id: true, nom: true, code: true } },
          createur: { select: { id: true, nom: true, prenom: true, email: true } },
        },
      }),
      this.prisma.depense.count({ where }),
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

  async findOneDepense(id: string) {
    const depense = await this.prisma.depense.findUnique({
      where: { id },
      include: {
        agence: { select: { id: true, nom: true, code: true } },
        createur: { select: { id: true, nom: true, prenom: true, email: true } },
      },
    });

    if (!depense) {
      throw new NotFoundException(`Dépense #${id} introuvable`);
    }

    return depense;
  }

  async createDepense(dto: CreateDepenseDto, createurId: string) {
    const agence = await this.prisma.agence.findUnique({ where: { id: dto.agenceId } });
    if (!agence) {
      throw new NotFoundException(`Agence #${dto.agenceId} introuvable`);
    }

    return this.prisma.depense.create({
      data: {
        libelle: dto.libelle,
        type: dto.type,
        montant: dto.montant,
        agenceId: dto.agenceId,
        description: dto.description,
        dateDepense: dto.dateDepense ? new Date(dto.dateDepense) : new Date(),
        createurId,
      },
      include: {
        agence: { select: { id: true, nom: true, code: true } },
        createur: { select: { id: true, nom: true, prenom: true } },
      },
    });
  }

  async updateDepense(id: string, dto: UpdateDepenseDto) {
    await this.findOneDepense(id);

    return this.prisma.depense.update({
      where: { id },
      data: {
        ...(dto.libelle !== undefined && { libelle: dto.libelle }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.montant !== undefined && { montant: dto.montant }),
        ...(dto.agenceId !== undefined && { agenceId: dto.agenceId }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dateDepense !== undefined && { dateDepense: new Date(dto.dateDepense) }),
      },
      include: {
        agence: { select: { id: true, nom: true, code: true } },
        createur: { select: { id: true, nom: true, prenom: true } },
      },
    });
  }

  async approuverDepense(id: string) {
    const depense = await this.findOneDepense(id);

    if (depense.statut !== 'EN_ATTENTE') {
      throw new BadRequestException(`La dépense est déjà ${depense.statut}`);
    }

    return this.prisma.depense.update({
      where: { id },
      data: { statut: 'APPROUVEE' },
    });
  }

  async rejeterDepense(id: string) {
    const depense = await this.findOneDepense(id);

    if (depense.statut !== 'EN_ATTENTE') {
      throw new BadRequestException(`La dépense est déjà ${depense.statut}`);
    }

    return this.prisma.depense.update({
      where: { id },
      data: { statut: 'REJETEE' },
    });
  }

  async payerDepense(id: string) {
    const depense = await this.findOneDepense(id);

    if (depense.statut !== 'APPROUVEE') {
      throw new BadRequestException('Seules les dépenses approuvées peuvent être payées');
    }

    const agence = await this.prisma.agence.findUnique({ where: { id: depense.agenceId } });
    if (!agence) {
      throw new NotFoundException('Agence introuvable');
    }

    if (agence.solde < depense.montant) {
      throw new BadRequestException('Solde de l\'agence insuffisant pour payer cette dépense');
    }

    const [depenseMaj] = await this.prisma.$transaction([
      this.prisma.depense.update({
        where: { id },
        data: { statut: 'PAYEE' },
      }),
      this.prisma.agence.update({
        where: { id: depense.agenceId },
        data: { solde: { decrement: depense.montant } },
      }),
    ]);

    return depenseMaj;
  }

  async getResumeFinancier(agenceId?: string) {
    const where: any = {};
    if (agenceId) where.agenceId = agenceId;

    const [parType, parStatut] = await Promise.all([
      this.prisma.depense.groupBy({
        by: ['type'],
        where,
        _sum: { montant: true },
        _count: { id: true },
      }),
      this.prisma.depense.groupBy({
        by: ['statut'],
        where,
        _sum: { montant: true },
        _count: { id: true },
      }),
    ]);

    return {
      parType: parType.map((r) => ({
        type: r.type,
        totalMontant: r._sum.montant ?? 0,
        count: r._count.id,
      })),
      parStatut: parStatut.map((r) => ({
        statut: r.statut,
        totalMontant: r._sum.montant ?? 0,
        count: r._count.id,
      })),
    };
  }

  async getBudgetMensuel(agenceId?: string) {
    const where: any = {};
    if (agenceId) where.agenceId = agenceId;

    const now = new Date();
    const debut12Mois = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    where.dateDepense = { gte: debut12Mois };

    const depenses = await this.prisma.depense.findMany({
      where,
      select: {
        montant: true,
        dateDepense: true,
        statut: true,
        type: true,
      },
      orderBy: { dateDepense: 'asc' },
    });

    const budgetParMois: Record<string, { mois: string; total: number; count: number }> = {};

    depenses.forEach((d) => {
      const mois = `${d.dateDepense.getFullYear()}-${String(d.dateDepense.getMonth() + 1).padStart(2, '0')}`;
      if (!budgetParMois[mois]) {
        budgetParMois[mois] = { mois, total: 0, count: 0 };
      }
      budgetParMois[mois].total += d.montant;
      budgetParMois[mois].count += 1;
    });

    return Object.values(budgetParMois).sort((a, b) => a.mois.localeCompare(b.mois));
  }
}
