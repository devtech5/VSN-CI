'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Eye, Pencil, ArrowLeftRight, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/lib/utils'
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
import AgentForm from '@/components/agents/AgentForm'
import Link from 'next/link'

const STATUT_BADGE: Record<string, { label: string; className: string }> = {
  ACTIF: { label: 'Actif', className: 'bg-green-100 text-green-800' },
  INACTIF: { label: 'Inactif', className: 'bg-gray-100 text-gray-700' },
  EN_CONGE: { label: 'En congé', className: 'bg-yellow-100 text-yellow-800' },
  SUSPENDU: { label: 'Suspendu', className: 'bg-red-100 text-red-800' },
}

export default function AgentsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [agenceId, setAgenceId] = useState('all')
  const [statut, setStatut] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const { data: agences = [] } = useQuery({
    queryKey: ['agences-list'],
    queryFn: () => api.get('/agences').then((r) => r.data),
  })

  const { data: agents = [], isLoading } = useQuery({
    queryKey: ['agents', search, agenceId, statut],
    queryFn: () =>
      api
        .get('/agents', {
          params: {
            search: search || undefined,
            agenceId: agenceId !== 'all' ? agenceId : undefined,
            statut: statut !== 'all' ? statut : undefined,
          },
        })
        .then((r) => r.data),
  })

  const toggleStatutMutation = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: string }) =>
      api.patch(`/agents/${id}/statut`, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Statut de l\'agent mis à jour')
    },
    onError: () => toast.error('Erreur lors de la mise à jour du statut'),
  })

  const canManage =
    user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN_AGENCE'

  const handleToggleStatut = (agent: any) => {
    const newStatut = agent.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF'
    toggleStatutMutation.mutate({ id: agent.id, statut: newStatut })
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#002366' }}>
            Gestion des Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez les agents de votre réseau
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowForm(true)}
            style={{ backgroundColor: '#002366' }}
            className="text-white hover:opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un agent
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Rechercher par nom ou matricule..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={agenceId} onValueChange={setAgenceId}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les agences" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les agences</SelectItem>
                {agences.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actif</SelectItem>
                <SelectItem value="INACTIF">Inactif</SelectItem>
                <SelectItem value="EN_CONGE">En congé</SelectItem>
                <SelectItem value="SUSPENDU">Suspendu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Agence</TableHead>
                <TableHead>Contrat</TableHead>
                <TableHead className="text-right">Solde</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : agents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun agent trouvé
                  </TableCell>
                </TableRow>
              ) : (
                agents.map((agent: any) => {
                  const badge = STATUT_BADGE[agent.statut] || STATUT_BADGE.INACTIF
                  return (
                    <TableRow key={agent.id}>
                      <TableCell className="font-mono text-sm">
                        {agent.matricule}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {agent.user?.prenom} {agent.user?.nom}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {agent.user?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{agent.agence?.nom || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{agent.typeContrat}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(agent.solde || 0).toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            badge.className
                          )}
                        >
                          {badge.label}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/agents/${agent.id}`}>
                            <Button variant="ghost" size="icon" title="Voir">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {canManage && (
                            <>
                              <Link href={`/agents/${agent.id}/modifier`}>
                                <Button variant="ghost" size="icon" title="Modifier">
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Changer d'agence"
                              >
                                <ArrowLeftRight className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                title={agent.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                                onClick={() => handleToggleStatut(agent)}
                              >
                                {agent.statut === 'ACTIF' ? (
                                  <ToggleRight className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showForm && <AgentForm open={showForm} onClose={() => setShowForm(false)} />}
    </div>
  )
}
