'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, ArrowLeftRight, ShieldBan } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { formatMontant, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: () => api.get(`/agents/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: performance } = useQuery({
    queryKey: ['agent-performance', id],
    queryFn: () => api.get(`/agents/${id}/performance`).then((r) => r.data),
    enabled: !!id,
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ['agent-transactions', id],
    queryFn: () =>
      api.get('/transactions', { params: { agentId: id, limit: 10 } }).then((r) => r.data),
    enabled: !!id,
  })

  const suspendMutation = useMutation({
    mutationFn: () => api.patch(`/agents/${id}/statut`, { statut: 'SUSPENDU' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', id] })
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent suspendu avec succès')
    },
    onError: () => toast.error('Erreur lors de la suspension'),
  })

  const canManage =
    user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_AGENCE'

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-64 text-muted-foreground">
        Chargement...
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Agent introuvable</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Retour
        </Button>
      </div>
    )
  }

  const initials = `${agent.user?.prenom?.[0] || ''}${agent.user?.nom?.[0] || ''}`.toUpperCase()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#002366' }}>
            Détail de l'agent
          </h1>
          <p className="text-sm text-muted-foreground">Matricule: {agent.matricule}</p>
        </div>
        {canManage && (
          <div className="ml-auto flex gap-2">
            <Link href={`/agents/${id}/modifier`}>
              <Button variant="outline">
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </Link>
            <Button variant="outline">
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Changer d'agence
            </Button>
            <Button
              variant="destructive"
              onClick={() => suspendMutation.mutate()}
              disabled={suspendMutation.isPending || agent.statut === 'SUSPENDU'}
            >
              <ShieldBan className="w-4 h-4 mr-2" />
              Suspendre
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info personnelle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                style={{ backgroundColor: '#002366' }}
              >
                {initials}
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {agent.user?.prenom} {agent.user?.nom}
                </p>
                <Badge
                  className={
                    agent.statut === 'ACTIF'
                      ? 'bg-green-100 text-green-800'
                      : agent.statut === 'SUSPENDU'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-700'
                  }
                >
                  {agent.statut}
                </Badge>
              </div>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{agent.user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Téléphone</dt>
                <dd className="font-medium">{agent.user?.telephone || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Agence</dt>
                <dd className="font-medium">{agent.agence?.nom || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Type de contrat</dt>
                <dd className="font-medium">{agent.typeContrat}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date d'embauche</dt>
                <dd className="font-medium">{formatDate(agent.dateEmbauche)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance financière</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                <dt className="text-sm text-muted-foreground">Solde</dt>
                <dd className="text-lg font-bold" style={{ color: '#002366' }}>
                  {formatMontant(agent.solde || 0)}
                </dd>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                <dt className="text-sm text-muted-foreground">Solde flottant</dt>
                <dd className="text-lg font-bold text-orange-600">
                  {formatMontant(agent.soldeFlottant || 0)}
                </dd>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                <dt className="text-sm text-muted-foreground">Commission totale</dt>
                <dd className="text-lg font-bold text-green-600">
                  {formatMontant(agent.commission || 0)}
                </dd>
              </div>
            </dl>

            {performance && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">
                  Stats du mois en cours
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                    <p className="text-2xl font-bold" style={{ color: '#002366' }}>
                      {performance.nbTransactions || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Transactions</p>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#f8f9fa' }}>
                    <p className="text-lg font-bold" style={{ color: '#F16E00' }}>
                      {formatMontant(performance.volumeTotal || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Volume</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dernières transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dernières transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    Aucune transaction récente
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                    <TableCell className="text-sm">{formatDate(tx.createdAt)}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{tx.nomClient || tx.numeroClient}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(tx.montant)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          tx.statut === 'VALIDEE'
                            ? 'bg-green-100 text-green-800'
                            : tx.statut === 'EN_ATTENTE'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {tx.statut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
