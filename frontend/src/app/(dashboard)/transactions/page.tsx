'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, CheckCircle, XCircle, Plus } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { cn, formatMontant, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import TransactionForm from '@/components/transactions/TransactionForm'
import TransactionDetail from '@/components/transactions/TransactionDetail'

const RESEAU_COLORS: Record<string, string> = {
  ORANGE: '#FF6600',
  MTN: '#FFCC00',
  MOOV: '#0066CC',
  WAVE: '#1BAFFA',
}

const STATUT_BADGE: Record<string, string> = {
  VALIDEE: 'bg-green-100 text-green-800',
  EN_ATTENTE: 'bg-yellow-100 text-yellow-800',
  ANNULEE: 'bg-red-100 text-red-800',
  ECHOUEE: 'bg-gray-100 text-gray-700',
}

const PAGE_SIZE = 20

export default function TransactionsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [reseau, setReseau] = useState('all')
  const [type, setType] = useState('all')
  const [statut, setStatut] = useState('all')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedTx, setSelectedTx] = useState<any>(null)

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_AGENCE'

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, search, reseau, type, statut, dateDebut, dateFin],
    queryFn: () =>
      api
        .get('/transactions', {
          params: {
            page,
            limit: PAGE_SIZE,
            search: search || undefined,
            reseau: reseau !== 'all' ? reseau : undefined,
            type: type !== 'all' ? type : undefined,
            statut: statut !== 'all' ? statut : undefined,
            dateDebut: dateDebut || undefined,
            dateFin: dateFin || undefined,
          },
        })
        .then((r) => r.data),
  })

  const transactions: any[] = data?.data || data || []
  const total: number = data?.total || transactions.length
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const validerMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/transactions/${id}/valider`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transaction validée')
    },
    onError: () => toast.error('Erreur lors de la validation'),
  })

  const annulerMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/transactions/${id}/annuler`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      toast.success('Transaction annulée')
    },
    onError: () => toast.error('Erreur lors de l\'annulation'),
  })

  const volumeTotal = transactions.reduce((sum: number, tx: any) => sum + Number(tx.montant || 0), 0)
  const totalFrais = transactions.reduce((sum: number, tx: any) => sum + Number(tx.frais || 0), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#002366' }}>
            Journal des Transactions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Historique complet des opérations
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          style={{ backgroundColor: '#F16E00' }}
          className="text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle transaction
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Input
              placeholder="N° client..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            />
            <Select value={reseau} onValueChange={(v) => { setReseau(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Réseau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous réseaux</SelectItem>
                <SelectItem value="ORANGE">Orange</SelectItem>
                <SelectItem value="MTN">MTN</SelectItem>
                <SelectItem value="MOOV">Moov</SelectItem>
                <SelectItem value="WAVE">Wave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="DEPOT">Dépôt</SelectItem>
                <SelectItem value="RETRAIT">Retrait</SelectItem>
                <SelectItem value="TRANSFERT">Transfert</SelectItem>
                <SelectItem value="PAIEMENT">Paiement</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={(v) => { setStatut(v); setPage(1) }}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="VALIDEE">Validée</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="ANNULEE">Annulée</SelectItem>
                <SelectItem value="ECHOUEE">Échouée</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateDebut}
              onChange={(e) => { setDateDebut(e.target.value); setPage(1) }}
            />
            <Input
              type="date"
              value={dateFin}
              onChange={(e) => { setDateFin(e.target.value); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Réseau</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Frais</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    Aucune transaction trouvée
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx: any) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.reference}</TableCell>
                    <TableCell className="text-xs">{formatDate(tx.createdAt)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{tx.nomClient || '-'}</p>
                        <p className="text-xs text-muted-foreground">{tx.numeroClient}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{tx.type}</TableCell>
                    <TableCell>
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ backgroundColor: RESEAU_COLORS[tx.reseau?.nom] || '#708090' }}
                      >
                        {tx.reseau?.nom || tx.reseau || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMontant(tx.montant)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatMontant(tx.frais || 0)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          STATUT_BADGE[tx.statut] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {tx.statut}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs">
                      {tx.agent?.user?.prenom} {tx.agent?.user?.nom?.[0]}.
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Voir détail"
                          onClick={() => setSelectedTx(tx)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {isAdmin && tx.statut === 'EN_ATTENTE' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Valider"
                              onClick={() => validerMutation.mutate(tx.id)}
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Annuler"
                              onClick={() => annulerMutation.mutate(tx.id)}
                            >
                              <XCircle className="w-4 h-4 text-red-500" />
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
        </CardContent>
      </Card>

      {/* Totaux */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Volume total</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#002366' }}>
              {formatMontant(volumeTotal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Nb transactions</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#002366' }}>
              {transactions.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total frais</p>
            <p className="text-xl font-bold mt-1" style={{ color: '#F16E00' }}>
              {formatMontant(totalFrais)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Suivant
          </Button>
        </div>
      )}

      {showForm && (
        <TransactionForm open={showForm} onClose={() => setShowForm(false)} />
      )}
      {selectedTx && (
        <TransactionDetail
          transaction={selectedTx}
          open={!!selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  )
}
