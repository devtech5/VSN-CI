'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import api from '@/lib/axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const agentSchema = z.object({
  userId: z.string().min(1, 'Utilisateur requis'),
  agenceId: z.string().min(1, 'Agence requise'),
  dateEmbauche: z.string().min(1, 'Date d\'embauche requise'),
  salaire: z.coerce.number().positive('Salaire invalide'),
  typeContrat: z.enum(['CDI', 'CDD', 'STAGE', 'FREELANCE']),
  commission: z.coerce.number().min(0).max(100),
})

type AgentFormData = z.infer<typeof agentSchema>

interface AgentFormProps {
  open: boolean
  onClose: () => void
}

export default function AgentForm({ open, onClose }: AgentFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      typeContrat: 'CDI',
      commission: 0,
    },
  })

  const { data: users = [] } = useQuery({
    queryKey: ['rh-users-sans-profil'],
    queryFn: () =>
      api.get('/rh/users', { params: { sansProfil: 'agent' } }).then((r) => r.data),
    enabled: open,
  })

  const { data: agences = [] } = useQuery({
    queryKey: ['agences-list'],
    queryFn: () => api.get('/agences').then((r) => r.data),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (data: AgentFormData) => api.post('/agents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent créé avec succès')
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la création de l\'agent')
    },
  })

  const onSubmit = (data: AgentFormData) => {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ color: '#002366' }}>Nouvel agent</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Utilisateur */}
          <div className="space-y-1">
            <Label>Utilisateur *</Label>
            <Select onValueChange={(v) => setValue('userId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un utilisateur" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u: any) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.prenom} {u.nom} — {u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-xs text-red-500">{errors.userId.message}</p>
            )}
          </div>

          {/* Agence */}
          <div className="space-y-1">
            <Label>Agence *</Label>
            <Select onValueChange={(v) => setValue('agenceId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une agence" />
              </SelectTrigger>
              <SelectContent>
                {agences.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nom} — {a.ville}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.agenceId && (
              <p className="text-xs text-red-500">{errors.agenceId.message}</p>
            )}
          </div>

          {/* Type contrat */}
          <div className="space-y-1">
            <Label>Type de contrat *</Label>
            <Select
              defaultValue="CDI"
              onValueChange={(v) => setValue('typeContrat', v as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CDI">CDI</SelectItem>
                <SelectItem value="CDD">CDD</SelectItem>
                <SelectItem value="STAGE">Stage</SelectItem>
                <SelectItem value="FREELANCE">Freelance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date embauche */}
          <div className="space-y-1">
            <Label>Date d'embauche *</Label>
            <Input type="date" {...register('dateEmbauche')} />
            {errors.dateEmbauche && (
              <p className="text-xs text-red-500">{errors.dateEmbauche.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Salaire */}
            <div className="space-y-1">
              <Label>Salaire (FCFA) *</Label>
              <Input
                type="number"
                placeholder="Ex: 150000"
                {...register('salaire')}
              />
              {errors.salaire && (
                <p className="text-xs text-red-500">{errors.salaire.message}</p>
              )}
            </div>

            {/* Commission */}
            <div className="space-y-1">
              <Label>Commission (%)</Label>
              <Input
                type="number"
                placeholder="Ex: 2"
                step="0.1"
                min="0"
                max="100"
                {...register('commission')}
              />
              {errors.commission && (
                <p className="text-xs text-red-500">{errors.commission.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              style={{ backgroundColor: '#002366' }}
              className="text-white hover:opacity-90"
            >
              {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
