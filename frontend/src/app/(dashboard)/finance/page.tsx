'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Search, CheckCircle, XCircle, CreditCard, Eye } from 'lucide-react';
import api from '@/lib/axios';
import { cn, formatMontant, formatDate, STATUT_COLORS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const TYPE_DEPENSE_LABELS: Record<string, string> = {
  LOYER: 'Loyer', SALAIRE: 'Salaire', FOURNITURES: 'Fournitures',
  TRANSPORT: 'Transport', COMMUNICATION: 'Communication', AUTRE: 'Autre',
};

export default function FinancePage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statut, setStatut] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ libelle: '', type: 'LOYER', montant: '', description: '', agenceId: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['depenses', { search, statut, type, page }],
    queryFn: () => api.get('/finance/depenses', {
      params: { statut: statut === 'ALL' ? undefined : statut, type: type === 'ALL' ? undefined : type, page, limit: 15 }
    }).then(r => r.data),
  });

  const { data: resume } = useQuery({
    queryKey: ['depenses-resume'],
    queryFn: () => api.get('/finance/depenses/resume').then(r => r.data),
  });

  const { data: agences } = useQuery({
    queryKey: ['agences-select'],
    queryFn: () => api.get('/agences').then(r => r.data?.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/finance/depenses', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depenses'] });
      queryClient.invalidateQueries({ queryKey: ['depenses-resume'] });
      toast.success('Dépense créée avec succès');
      setOpenForm(false);
      setForm({ libelle: '', type: 'LOYER', montant: '', description: '', agenceId: '' });
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) => api.patch(`/finance/depenses/${id}/${action}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['depenses'] }); toast.success('Action effectuée'); },
    onError: () => toast.error('Erreur lors de l\'action'),
  });

  const canAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_AGENCE';
  const depenses = data?.data || [];
  const total = data?.total || 0;

  const resumeCards = [
    { label: 'Total dépenses', value: resume?.total || 0, color: 'text-[#002366]', bg: 'bg-blue-50' },
    { label: 'Approuvées', value: resume?.approuvees || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'En attente', value: resume?.enAttente || 0, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Payées', value: resume?.payees || 0, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#002366]">Gestion des Dépenses</h1>
          <p className="text-sm text-gray-500 mt-1">{total} dépense(s) au total</p>
        </div>
        {canAdmin && (
          <Button onClick={() => setOpenForm(true)} className="bg-[#002366] hover:bg-[#001a4d] text-white gap-2">
            <Plus className="w-4 h-4" /> Nouvelle dépense
          </Button>
        )}
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {resumeCards.map((c) => (
          <div key={c.label} className={cn('rounded-xl p-4 border border-gray-100', c.bg)}>
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={cn('text-xl font-bold', c.color)}>{formatMontant(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <Select value={type} onValueChange={v => { setType(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les types</SelectItem>
            {Object.entries(TYPE_DEPENSE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statut} onValueChange={v => { setStatut(v); setPage(1); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="EN_ATTENTE">En attente</SelectItem>
            <SelectItem value="APPROUVEE">Approuvée</SelectItem>
            <SelectItem value="REJETEE">Rejetée</SelectItem>
            <SelectItem value="PAYEE">Payée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Libellé</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Agence</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : depenses.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">Aucune dépense trouvée</TableCell></TableRow>
            ) : (
              depenses.map((d: any) => (
                <TableRow key={d.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium text-sm">{d.libelle}</TableCell>
                  <TableCell><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{TYPE_DEPENSE_LABELS[d.type] || d.type}</span></TableCell>
                  <TableCell className="text-sm text-gray-600">{d.agence?.nom || '—'}</TableCell>
                  <TableCell className="text-right font-semibold">{formatMontant(d.montant)}</TableCell>
                  <TableCell><span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUT_COLORS[d.statut])}>{d.statut.replace('_', ' ')}</span></TableCell>
                  <TableCell className="text-sm text-gray-500">{formatDate(d.dateDepense)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canAdmin && d.statut === 'EN_ATTENTE' && (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600 hover:text-green-800"
                            title="Approuver" onClick={() => actionMutation.mutate({ id: d.id, action: 'approuver' })}>
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            title="Rejeter" onClick={() => actionMutation.mutate({ id: d.id, action: 'rejeter' })}>
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {canAdmin && d.statut === 'APPROUVEE' && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800"
                          title="Marquer payée" onClick={() => actionMutation.mutate({ id: d.id, action: 'payer' })}>
                          <CreditCard className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {total > 15 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">Page {page} sur {Math.ceil(total / 15)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
              <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Suivant</Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog Nouvelle Dépense */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Libellé *</Label>
              <Input value={form.libelle} onChange={e => setForm(f => ({ ...f, libelle: e.target.value }))} placeholder="Ex: Loyer janvier 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_DEPENSE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Montant (XOF) *</Label>
                <Input type="number" value={form.montant} onChange={e => setForm(f => ({ ...f, montant: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Agence *</Label>
              <Select value={form.agenceId} onValueChange={v => setForm(f => ({ ...f, agenceId: v }))}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une agence" /></SelectTrigger>
                <SelectContent>{(agences || []).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails optionnels..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Annuler</Button>
            <Button className="bg-[#002366] text-white" disabled={createMutation.isPending}
              onClick={() => createMutation.mutate({ ...form, montant: Number(form.montant) })}>
              {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
