'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Wallet,
  ToggleLeft,
  ToggleRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

import api from '@/lib/axios';
import { cn, formatMontant, STATUT_COLORS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import type { Agence, PaginatedResponse } from '@/types';
import { AgenceForm } from '@/components/agences/AgenceForm';

const LIMIT = 10;

async function fetchAgences(page: number, search: string, statut: string): Promise<PaginatedResponse<Agence>> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(LIMIT),
    ...(search && { search }),
    ...(statut && { statut }),
  });
  const { data } = await api.get(`/agences?${params}`);
  return data;
}

function StatutBadge({ statut }: { statut: string }) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', STATUT_COLORS[statut] ?? 'bg-gray-100 text-gray-600')}
    >
      <span
        className="w-1.5 h-1.5 rounded-full mr-1.5"
        style={{
          background:
            statut === 'ACTIVE' ? '#16a34a'
            : statut === 'SUSPENDUE' ? '#dc2626'
            : '#9ca3af',
        }}
      />
      {statut === 'ACTIVE' ? 'Active' : statut === 'INACTIVE' ? 'Inactive' : 'Suspendue'}
    </span>
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 8 }).map((__, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 rounded animate-pulse" style={{ background: '#f0f2f5', width: j === 7 ? 80 : '80%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AgencesPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAgence, setEditingAgence] = useState<Agence | null>(null);

  const { data, isLoading } = useQuery<PaginatedResponse<Agence>>({
    queryKey: ['agences', page, search, statut],
    queryFn: () => fetchAgences(page, search, statut),
  });

  const toggleStatutMutation = useMutation({
    mutationFn: async ({ id, newStatut }: { id: string; newStatut: string }) => {
      const { data } = await api.patch(`/agences/${id}/statut`, { statut: newStatut });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agences'] });
      toast.success('Statut mis à jour');
    },
    onError: () => toast.error('Impossible de modifier le statut'),
  });

  const handleToggleStatut = (agence: Agence) => {
    const newStatut = agence.statut === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatutMutation.mutate({ id: agence.id, newStatut });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatutFilter = (value: string) => {
    setStatut(value);
    setPage(1);
  };

  const agences = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const openCreate = () => {
    setEditingAgence(null);
    setShowForm(true);
  };

  const openEdit = (agence: Agence) => {
    setEditingAgence(agence);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAgence(null);
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold" style={{ color: '#002366' }}>Gestion des Agences</h2>
          <p className="text-sm mt-0.5" style={{ color: '#708090' }}>
            {total > 0 ? `${total} agence${total > 1 ? 's' : ''} au total` : 'Aucune agence'}
          </p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #F16E00, #d45f00)' }}
          >
            <Plus className="w-4 h-4" />
            Nouvelle agence
          </button>
        )}
      </div>

      {/* Filters */}
      <div
        className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        style={{ background: 'white', border: '1px solid rgba(0,35,102,0.06)' }}
      >
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#708090' }} />
          <input
            type="text"
            placeholder="Rechercher par nom, code, ville..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: '#f8f9fa',
              border: '1px solid rgba(0,35,102,0.08)',
              color: '#002366',
            }}
          />
          {search && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5" style={{ color: '#708090' }} />
            </button>
          )}
        </div>

        {/* Statut filter */}
        <select
          value={statut}
          onChange={(e) => handleStatutFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl text-sm outline-none cursor-pointer transition-all"
          style={{
            background: '#f8f9fa',
            border: '1px solid rgba(0,35,102,0.08)',
            color: '#002366',
            minWidth: 140,
          }}
        >
          <option value="">Tous les statuts</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDUE">Suspendue</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '1px solid rgba(0,35,102,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '1px solid rgba(0,35,102,0.06)' }}>
                {['Code', 'Nom', 'Ville', 'Nb Agents', 'Solde', 'Statut', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#708090' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'rgba(0,35,102,0.04)' }}>
              {isLoading ? (
                <TableSkeleton />
              ) : agences.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Building2 className="w-10 h-10" style={{ color: 'rgba(0,35,102,0.15)' }} />
                      <p className="text-sm" style={{ color: '#708090' }}>
                        {search || statut ? 'Aucun résultat pour ces filtres' : 'Aucune agence enregistrée'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                agences.map((agence) => (
                  <tr
                    key={agence.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'rgba(0,35,102,0.06)', color: '#002366' }}>
                        {agence.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: '#002366' }}>
                      {agence.nom}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#708090' }}>{agence.ville}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold" style={{ color: '#002366' }}>
                        {agence._count?.agents ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: '#002366' }}>
                      {formatMontant(agence.solde)}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={agence.statut} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Voir */}
                        <Link
                          href={`/agences/${agence.id}`}
                          title="Voir les détails"
                          className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                        >
                          <Eye className="w-4 h-4" style={{ color: '#708090' }} />
                        </Link>

                        {/* Modifier */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => openEdit(agence)}
                            title="Modifier"
                            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100"
                          >
                            <Pencil className="w-4 h-4" style={{ color: '#708090' }} />
                          </button>
                        )}

                        {/* Approvisionner */}
                        {isSuperAdmin && (
                          <button
                            title="Approvisionner"
                            className="p-1.5 rounded-lg transition-colors hover:bg-orange-50"
                          >
                            <Wallet className="w-4 h-4" style={{ color: '#F16E00' }} />
                          </button>
                        )}

                        {/* Toggle statut */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleToggleStatut(agence)}
                            disabled={toggleStatutMutation.isPending}
                            title={agence.statut === 'ACTIVE' ? 'Désactiver' : 'Activer'}
                            className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-50"
                          >
                            {agence.statut === 'ACTIVE' ? (
                              <ToggleRight className="w-4 h-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" style={{ color: '#708090' }} />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid rgba(0,35,102,0.06)' }}
          >
            <p className="text-xs" style={{ color: '#708090' }}>
              Page {page} sur {totalPages} — {total} résultat{total > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#002366' }} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded-lg text-xs font-semibold transition-all',
                      pageNum === page ? 'text-white' : 'hover:bg-gray-100',
                    )}
                    style={
                      pageNum === page
                        ? { background: '#002366', color: 'white' }
                        : { color: '#708090' }
                    }
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#002366' }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal/Sheet for create/edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeForm}
          />
          {/* Modal */}
          <div
            className="relative z-10 w-full max-w-lg rounded-2xl p-6 shadow-2xl"
            style={{ background: 'white', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button
              onClick={closeForm}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" style={{ color: '#708090' }} />
            </button>
            <AgenceForm
              agence={editingAgence}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </div>
  );
}
