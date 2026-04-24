'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Users,
  Wallet,
  ArrowLeftRight,
  Hash,
} from 'lucide-react';

import api from '@/lib/axios';
import { cn, formatMontant, formatDate, STATUT_COLORS } from '@/lib/utils';
import type { Agence, Agent, Transaction } from '@/types';

type TabId = 'infos' | 'agents' | 'transactions';

interface AgenceDetailData {
  agence: Agence;
  agents: Agent[];
  transactions: Transaction[];
}

async function fetchAgenceDetail(id: string): Promise<AgenceDetailData> {
  const [agenceRes, agentsRes, txRes] = await Promise.all([
    api.get(`/agences/${id}`),
    api.get(`/agents?agenceId=${id}&limit=20`),
    api.get(`/transactions?agenceId=${id}&limit=20`),
  ]);
  return {
    agence: agenceRes.data,
    agents: agentsRes.data?.data ?? agentsRes.data,
    transactions: txRes.data?.data ?? txRes.data,
  };
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{ background: '#f8f9fa', border: '1px solid rgba(0,35,102,0.06)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'rgba(0,35,102,0.08)' }}
      >
        <Icon className="w-4 h-4" style={{ color: '#002366' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium mb-0.5" style={{ color: '#708090' }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color: '#002366' }}>{value || '—'}</p>
      </div>
    </div>
  );
}

function StatutBadge({ statut }: { statut: string }) {
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold', STATUT_COLORS[statut] ?? 'bg-gray-100 text-gray-600')}>
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{
          background: statut === 'ACTIVE' ? '#16a34a' : statut === 'SUSPENDUE' ? '#dc2626' : '#9ca3af',
        }}
      />
      {statut === 'ACTIVE' ? 'Active' : statut === 'INACTIVE' ? 'Inactive' : 'Suspendue'}
    </span>
  );
}

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'infos', label: 'Infos générales', icon: Building2 },
  { id: 'agents', label: 'Agents', icon: Users },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
];

export default function AgenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<TabId>('infos');

  const { data, isLoading, error } = useQuery<AgenceDetailData>({
    queryKey: ['agence-detail', id],
    queryFn: () => fetchAgenceDetail(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 rounded-xl" style={{ background: '#f0f2f5' }} />
        <div className="h-24 rounded-2xl" style={{ background: '#f0f2f5' }} />
        <div className="h-64 rounded-2xl" style={{ background: '#f0f2f5' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Building2 className="w-12 h-12" style={{ color: 'rgba(0,35,102,0.2)' }} />
        <p className="text-lg font-semibold" style={{ color: '#002366' }}>Agence introuvable</p>
        <button
          onClick={() => router.back()}
          className="text-sm font-medium hover:underline"
          style={{ color: '#F16E00' }}
        >
          ← Retour à la liste
        </button>
      </div>
    );
  }

  const { agence, agents, transactions } = data;

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: '#708090' }}
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux agences
      </button>

      {/* Header card */}
      <div
        className="rounded-2xl p-6"
        style={{ background: 'white', border: '1px solid rgba(0,35,102,0.06)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,35,102,0.08)' }}
            >
              <Building2 className="w-7 h-7" style={{ color: '#002366' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold" style={{ color: '#002366' }}>{agence.nom}</h2>
                <StatutBadge statut={agence.statut} />
              </div>
              <p className="text-sm mt-0.5" style={{ color: '#708090' }}>
                Code: <span className="font-mono font-semibold" style={{ color: '#002366' }}>{agence.code}</span>
                {' · '}{agence.ville}
              </p>
            </div>
          </div>

          {/* Solde highlight */}
          <div
            className="flex flex-col items-end px-5 py-3 rounded-xl"
            style={{ background: 'rgba(241,110,0,0.08)', border: '1px solid rgba(241,110,0,0.15)' }}
          >
            <p className="text-xs font-medium mb-0.5" style={{ color: '#F16E00' }}>Solde</p>
            <p className="text-2xl font-bold" style={{ color: '#002366' }}>
              {formatMontant(agence.solde)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '1px solid rgba(0,35,102,0.06)' }}
      >
        {/* Tab bar */}
        <div className="flex" style={{ borderBottom: '1px solid rgba(0,35,102,0.06)' }}>
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all relative',
                activeTab === tabId ? '' : 'hover:bg-gray-50',
              )}
              style={{
                color: activeTab === tabId ? '#002366' : '#708090',
                borderBottom: activeTab === tabId ? '2px solid #F16E00' : '2px solid transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {/* INFOS TAB */}
          {activeTab === 'infos' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <InfoCard label="Code agence" value={agence.code} icon={Hash} />
                <InfoCard label="Téléphone" value={agence.telephone} icon={Phone} />
                <InfoCard label="Email" value={agence.email ?? '—'} icon={Mail} />
                <InfoCard label="Adresse" value={agence.adresse} icon={MapPin} />
                <InfoCard label="Ville" value={agence.ville} icon={MapPin} />
                <InfoCard label="Nombre d'agents" value={String(agence._count?.agents ?? 0)} icon={Users} />
                <InfoCard label="Solde" value={formatMontant(agence.solde)} icon={Wallet} />
                <InfoCard label="Date de création" value={formatDate(agence.createdAt, 'long')} icon={Building2} />
              </div>
            </div>
          )}

          {/* AGENTS TAB */}
          {activeTab === 'agents' && (
            <div>
              {agents.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Users className="w-10 h-10" style={{ color: 'rgba(0,35,102,0.15)' }} />
                  <p className="text-sm" style={{ color: '#708090' }}>Aucun agent dans cette agence</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0,35,102,0.06)' }}>
                        {['Matricule', 'Nom', 'Prénom', 'Statut', 'Solde', 'Contrat'].map((h) => (
                          <th
                            key={h}
                            className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider"
                            style={{ color: '#708090' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'rgba(0,35,102,0.04)' }}>
                      {agents.map((agent) => (
                        <tr key={agent.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 pr-4">
                            <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(0,35,102,0.06)', color: '#002366' }}>
                              {agent.matricule}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-medium" style={{ color: '#002366' }}>{agent.user?.nom ?? '—'}</td>
                          <td className="py-3 pr-4" style={{ color: '#708090' }}>{agent.user?.prenom ?? '—'}</td>
                          <td className="py-3 pr-4">
                            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', STATUT_COLORS[agent.statut] ?? 'bg-gray-100 text-gray-600')}>
                              {agent.statut}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-semibold" style={{ color: '#002366' }}>
                            {formatMontant(agent.solde)}
                          </td>
                          <td className="py-3 pr-4 text-xs" style={{ color: '#708090' }}>
                            {agent.typeContrat}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TRANSACTIONS TAB */}
          {activeTab === 'transactions' && (
            <div>
              {transactions.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <ArrowLeftRight className="w-10 h-10" style={{ color: 'rgba(0,35,102,0.15)' }} />
                  <p className="text-sm" style={{ color: '#708090' }}>Aucune transaction pour cette agence</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(0,35,102,0.06)' }}>
                        {['Référence', 'Type', 'Montant', 'Réseau', 'Statut', 'Date'].map((h) => (
                          <th
                            key={h}
                            className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider"
                            style={{ color: '#708090' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'rgba(0,35,102,0.04)' }}>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 pr-4">
                            <span className="font-mono text-xs" style={{ color: '#708090' }}>
                              {tx.reference}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="text-xs font-semibold px-2.5 py-1 rounded-full"
                              style={{
                                background: 'rgba(0,35,102,0.08)',
                                color: '#002366',
                              }}
                            >
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-semibold" style={{ color: '#002366' }}>
                            {formatMontant(tx.montant)}
                          </td>
                          <td className="py-3 pr-4 text-xs" style={{ color: '#708090' }}>
                            {tx.reseau?.nom ?? '—'}
                          </td>
                          <td className="py-3 pr-4">
                            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', STATUT_COLORS[tx.statut] ?? 'bg-gray-100 text-gray-600')}>
                              {tx.statut}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs" style={{ color: '#708090' }}>
                            {formatDate(tx.createdAt, 'heure')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
