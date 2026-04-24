'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Power, Wifi } from 'lucide-react';
import api from '@/lib/axios';
import { cn, formatMontant } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const RESEAU_COLORS: Record<string, string> = {
  WAVE: '#1BA8E0', MTN: '#FFCC00', ORANGE: '#F16E00', MOOV: '#0066CC', AUTRE: '#6B7280',
};

export default function ReseauxPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: reseaux, isLoading } = useQuery({
    queryKey: ['reseaux'],
    queryFn: () => api.get('/reseaux').then(r => r.data),
  });

  const { data: soldes } = useQuery({
    queryKey: ['reseaux-soldes'],
    queryFn: () => api.get('/reseaux/soldes').then(r => r.data),
  });

  const toggleActif = useMutation({
    mutationFn: (id: string) => api.patch(`/reseaux/${id}/actif`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reseaux'] }); toast.success('Statut mis à jour'); },
    onError: () => toast.error('Erreur'),
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#002366]">Réseaux Mobiles</h1>
          <p className="text-sm text-gray-500 mt-1">Gestion des opérateurs Mobile Money</p>
        </div>
        {isSuperAdmin && (
          <Button className="bg-[#002366] hover:bg-[#001a4d] text-white gap-2">
            <Plus className="w-4 h-4" /> Ajouter un réseau
          </Button>
        )}
      </div>

      {/* Solde total */}
      {soldes && (
        <div className="bg-[#002366] rounded-xl p-6 text-white">
          <p className="text-sm opacity-70">Solde total plateforme</p>
          <p className="text-3xl font-bold mt-1">{formatMontant(soldes.total || 0)}</p>
        </div>
      )}

      {/* Grille des réseaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)
        ) : (
          (reseaux || []).map((reseau: any) => {
            const couleur = RESEAU_COLORS[reseau.type] || reseau.couleur || '#6B7280';
            const soldeReseau = soldes?.parReseau?.find((s: any) => s.reseauId === reseau.id);
            return (
              <div key={reseau.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Bande colorée */}
                <div className="h-2" style={{ backgroundColor: couleur }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${couleur}20` }}>
                        <Wifi className="w-5 h-5" style={{ color: couleur }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{reseau.nom}</h3>
                        <span className="text-xs text-gray-400">{reseau.type}</span>
                      </div>
                    </div>
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium',
                      reseau.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                      {reseau.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Solde total</span>
                      <span className="font-semibold">{formatMontant(soldeReseau?.solde || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Commission</span>
                      <span className="font-medium">{reseau.tauxCommission}%</span>
                    </div>
                  </div>

                  {isSuperAdmin && (
                    <div className="mt-4 pt-4 border-t flex justify-end">
                      <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7"
                        onClick={() => toggleActif.mutate(reseau.id)}>
                        <Power className="w-3 h-3" />
                        {reseau.actif ? 'Désactiver' : 'Activer'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
