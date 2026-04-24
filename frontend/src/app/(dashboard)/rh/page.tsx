'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserPlus, Search, Shield, KeyRound, Power, Edit } from 'lucide-react';
import api from '@/lib/axios';
import { cn, formatDate, STATUT_COLORS, ROLE_LABELS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function RhPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('ALL');
  const [statut, setStatut] = useState('ALL');
  const [page, setPage] = useState(1);
  const [openForm, setOpenForm] = useState(false);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', motDePasse: '', role: 'AGENT', agenceId: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['users-rh', { search, role, statut, page }],
    queryFn: () => api.get('/rh/users', {
      params: { search, role: role === 'ALL' ? undefined : role, statut: statut === 'ALL' ? undefined : statut, page, limit: 15 }
    }).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['rh-stats'],
    queryFn: () => api.get('/rh/users/stats').then(r => r.data),
  });

  const { data: agences } = useQuery({
    queryKey: ['agences-select'],
    queryFn: () => api.get('/agences').then(r => r.data?.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (d: any) => api.post('/rh/users', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-rh'] });
      toast.success('Utilisateur créé avec succès');
      setOpenForm(false);
      setForm({ nom: '', prenom: '', email: '', telephone: '', motDePasse: '', role: 'AGENT', agenceId: '' });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Erreur lors de la création'),
  });

  const toggleStatut = useMutation({
    mutationFn: (id: string) => api.patch(`/rh/users/${id}/statut`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users-rh'] }); toast.success('Statut mis à jour'); },
  });

  const resetPassword = useMutation({
    mutationFn: (id: string) => api.patch(`/rh/users/${id}/reset-password`),
    onSuccess: (data) => toast.success(`Nouveau mot de passe: ${data.data?.nouveauMotDePasse}`),
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const users = data?.data || [];
  const total = data?.total || 0;

  const statsCards = [
    { label: 'Super Admins', count: stats?.SUPER_ADMIN || 0, color: 'bg-purple-50 text-purple-700' },
    { label: 'Admins Agence', count: stats?.ADMIN_AGENCE || 0, color: 'bg-blue-50 text-blue-700' },
    { label: 'Agents', count: stats?.AGENT || 0, color: 'bg-green-50 text-green-700' },
    { label: 'Caissiers', count: stats?.CAISSIER || 0, color: 'bg-orange-50 text-orange-700' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#002366]">Ressources Humaines</h1>
          <p className="text-sm text-gray-500 mt-1">{total} utilisateur(s) au total</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setOpenForm(true)} className="bg-[#002366] hover:bg-[#001a4d] text-white gap-2">
            <UserPlus className="w-4 h-4" /> Nouvel utilisateur
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((c) => (
          <div key={c.label} className={cn('rounded-xl p-4 border border-gray-100 bg-white')}>
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={cn('text-3xl font-bold mt-1', c.color.split(' ')[1])}>{c.count}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Rechercher par nom ou email..." className="pl-9"
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={role} onValueChange={v => { setRole(v); setPage(1); }}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Rôle" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les rôles</SelectItem>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statut} onValueChange={v => { setStatut(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous</SelectItem>
            <SelectItem value="ACTIF">Actif</SelectItem>
            <SelectItem value="INACTIF">Inactif</SelectItem>
            <SelectItem value="SUSPENDU">Suspendu</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Utilisateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Agence</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Dernier login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>{Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-12 text-gray-400">Aucun utilisateur trouvé</TableCell></TableRow>
            ) : (
              users.map((u: any) => (
                <TableRow key={u.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#002366] text-white flex items-center justify-center text-xs font-semibold">
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{u.prenom} {u.nom}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs font-medium bg-[#002366]/10 text-[#002366] px-2 py-1 rounded-full">
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{u.agence?.nom || '—'}</TableCell>
                  <TableCell className="text-sm text-gray-600">{u.telephone}</TableCell>
                  <TableCell>
                    <span className={cn('text-xs px-2 py-1 rounded-full font-medium', STATUT_COLORS[u.statut])}>
                      {u.statut}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {u.dernierLogin ? formatDate(u.dernierLogin, 'heure') : 'Jamais'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="w-3.5 h-3.5" /></Button>
                      {isSuperAdmin && (
                        <>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-orange-500"
                            title="Reset MDP" onClick={() => resetPassword.mutate(u.id)}>
                            <KeyRound className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500"
                            title="Toggle statut" onClick={() => toggleStatut.mutate(u.id)}>
                            <Power className="w-3.5 h-3.5" />
                          </Button>
                        </>
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

      {/* Dialog Nouvel utilisateur */}
      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvel utilisateur</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Prénom *</Label><Input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Nom *</Label><Input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Téléphone *</Label><Input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="+225XXXXXXXXXX" /></div>
            <div className="space-y-1.5"><Label>Mot de passe *</Label><Input type="password" value={form.motDePasse} onChange={e => setForm(f => ({ ...f, motDePasse: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Rôle *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ROLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {(form.role === 'ADMIN_AGENCE' || form.role === 'AGENT' || form.role === 'CAISSIER') && (
                <div className="space-y-1.5">
                  <Label>Agence *</Label>
                  <Select value={form.agenceId} onValueChange={v => setForm(f => ({ ...f, agenceId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choisir..." /></SelectTrigger>
                    <SelectContent>{(agences || []).map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenForm(false)}>Annuler</Button>
            <Button className="bg-[#002366] text-white" disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(form)}>
              {createMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
