import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formater les montants en XOF
export function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(montant);
}

// Formater une date
export function formatDate(date: string | Date, format: 'court' | 'long' | 'heure' = 'court'): string {
  const d = new Date(date);
  if (format === 'heure') {
    return d.toLocaleString('fr-CI', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  if (format === 'long') {
    return d.toLocaleDateString('fr-CI', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return d.toLocaleDateString('fr-CI');
}

export const STATUT_COLORS: Record<string, string> = {
  ACTIF: 'bg-green-100 text-green-700',
  ACTIVE: 'bg-green-100 text-green-700',
  VALIDEE: 'bg-green-100 text-green-700',
  INACTIF: 'bg-gray-100 text-gray-600',
  INACTIVE: 'bg-gray-100 text-gray-600',
  SUSPENDU: 'bg-red-100 text-red-700',
  SUSPENDUE: 'bg-red-100 text-red-700',
  EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
  ECHOUEE: 'bg-red-100 text-red-700',
  ANNULEE: 'bg-gray-100 text-gray-600',
  APPROUVEE: 'bg-blue-100 text-blue-700',
  PAYEE: 'bg-green-100 text-green-700',
  REJETEE: 'bg-red-100 text-red-700',
  EN_CONGE: 'bg-orange-100 text-orange-700',
};

export const TYPE_TRANSACTION_LABELS: Record<string, string> = {
  DEPOT: 'Dépôt',
  RETRAIT: 'Retrait',
  TRANSFERT: 'Transfert',
  PAIEMENT: 'Paiement',
  RECHARGEMENT: 'Rechargement',
  REMBOURSEMENT: 'Remboursement',
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN_AGENCE: 'Admin Agence',
  AGENT: 'Agent',
  CAISSIER: 'Caissier',
};

export const TYPE_RESEAU_LABELS: Record<string, { label: string; couleur: string }> = {
  WAVE: { label: 'Wave', couleur: '#1BA8E0' },
  MTN: { label: 'MTN', couleur: '#FFCC00' },
  ORANGE: { label: 'Orange', couleur: '#F16E00' },
  MOOV: { label: 'Moov', couleur: '#0066CC' },
  AUTRE: { label: 'Autre', couleur: '#6B7280' },
};
