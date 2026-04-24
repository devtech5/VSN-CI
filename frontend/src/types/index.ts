// ─── Types communs VSN-CI Mobile Money ────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'ADMIN_AGENCE' | 'AGENT' | 'CAISSIER';
export type StatutUser = 'ACTIF' | 'INACTIF' | 'SUSPENDU';
export type StatutAgence = 'ACTIVE' | 'INACTIVE' | 'SUSPENDUE';
export type StatutAgent = 'ACTIF' | 'INACTIF' | 'EN_CONGE' | 'SUSPENDU';
export type TypeTransaction = 'DEPOT' | 'RETRAIT' | 'TRANSFERT' | 'PAIEMENT' | 'RECHARGEMENT' | 'REMBOURSEMENT';
export type StatutTransaction = 'EN_ATTENTE' | 'VALIDEE' | 'ECHOUEE' | 'ANNULEE' | 'REMBOURSEE';
export type TypeReseau = 'WAVE' | 'MTN' | 'ORANGE' | 'MOOV' | 'AUTRE';
export type TypeDepense = 'LOYER' | 'SALAIRE' | 'FOURNITURES' | 'TRANSPORT' | 'COMMUNICATION' | 'AUTRE';
export type StatutDepense = 'EN_ATTENTE' | 'APPROUVEE' | 'REJETEE' | 'PAYEE';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: Role;
  statut: StatutUser;
  avatar?: string;
  dernierLogin?: string;
  agence?: Agence | null;
  agentProfil?: Agent | null;
  createdAt: string;
}

export interface Agence {
  id: string;
  code: string;
  nom: string;
  adresse: string;
  ville: string;
  telephone: string;
  email?: string;
  statut: StatutAgence;
  solde: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  _count?: { agents: number };
}

export interface Agent {
  id: string;
  matricule: string;
  statut: StatutAgent;
  solde: number;
  soldeFlottant: number;
  typeContrat: string;
  dateEmbauche: string;
  salaire?: number;
  commission: number;
  user: User;
  agence: Agence;
  createdAt: string;
}

export interface Reseau {
  id: string;
  nom: string;
  type: TypeReseau;
  couleur: string;
  logo?: string;
  actif: boolean;
  tauxCommission: number;
}

export interface Transaction {
  id: string;
  reference: string;
  type: TypeTransaction;
  statut: StatutTransaction;
  montant: number;
  frais: number;
  montantNet: number;
  numeroClient: string;
  nomClient?: string;
  description?: string;
  valideeAt?: string;
  createdAt: string;
  reseau?: Reseau;
  agence: Agence;
  agent: User;
}

export interface Depense {
  id: string;
  libelle: string;
  type: TypeDepense;
  montant: number;
  statut: StatutDepense;
  description?: string;
  dateDepense: string;
  createdAt: string;
  agence: Agence;
  createur: User;
}

export interface DashboardOverview {
  nbAgences: number;
  nbAgents: number;
  transactionsDuJour: number;
  volumeDuJour: number;
  soldeTotal: number;
  topAgences: { agenceId: string; nom: string; volume: number }[];
  repartitionReseau: { reseauId: string; nom: string; couleur: string; volume: number }[];
  evolution7Jours: { date: string; nb: number; volume: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
