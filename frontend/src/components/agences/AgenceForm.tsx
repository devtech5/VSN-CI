'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import type { Agence } from '@/types';

const agenceSchema = z.object({
  code: z
    .string()
    .min(2, 'Le code doit contenir au moins 2 caractères')
    .max(10, 'Le code ne peut pas dépasser 10 caractères')
    .regex(/^[A-Z0-9-]+$/, 'Le code doit être en majuscules (lettres, chiffres, tirets)'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  adresse: z.string().min(5, 'L\'adresse doit contenir au moins 5 caractères'),
  ville: z.string().min(2, 'La ville doit contenir au moins 2 caractères'),
  telephone: z
    .string()
    .min(8, 'Numéro de téléphone invalide')
    .regex(/^[+\d\s()-]+$/, 'Format de téléphone invalide'),
  email: z
    .string()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: 'Adresse email invalide',
    }),
});

type AgenceFormData = z.infer<typeof agenceSchema>;

interface AgenceFormProps {
  agence?: Agence | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium" style={{ color: '#002366' }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: '#F16E00' }}>*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = (hasError?: boolean) =>
  cn(
    'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all duration-150',
    'border focus:ring-2',
    hasError
      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-400'
      : 'border-gray-200 focus:ring-blue-500/20 focus:border-blue-400',
  );

export function AgenceForm({ agence, onSuccess, onCancel }: AgenceFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!agence;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AgenceFormData>({
    resolver: zodResolver(agenceSchema),
    defaultValues: {
      code: agence?.code ?? '',
      nom: agence?.nom ?? '',
      adresse: agence?.adresse ?? '',
      ville: agence?.ville ?? '',
      telephone: agence?.telephone ?? '',
      email: agence?.email ?? '',
    },
  });

  // Sync if agence prop changes
  useEffect(() => {
    if (agence) {
      reset({
        code: agence.code,
        nom: agence.nom,
        adresse: agence.adresse,
        ville: agence.ville,
        telephone: agence.telephone,
        email: agence.email ?? '',
      });
    } else {
      reset({ code: '', nom: '', adresse: '', ville: '', telephone: '', email: '' });
    }
  }, [agence, reset]);

  const mutation = useMutation({
    mutationFn: async (formData: AgenceFormData) => {
      if (isEditing && agence?.id) {
        const { data } = await api.patch(`/agences/${agence.id}`, formData);
        return data;
      }
      const { data } = await api.post('/agences', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agences'] });
      toast.success(isEditing ? 'Agence modifiée avec succès' : 'Agence créée avec succès');
      onSuccess?.();
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } } };
      const message =
        error?.response?.data?.message ?? 'Une erreur est survenue. Veuillez réessayer.';
      toast.error('Erreur', { description: message });
    },
  });

  const onSubmit = (data: AgenceFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Form header */}
      <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid rgba(0,35,102,0.08)' }}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(0,35,102,0.08)' }}
        >
          <Building2 className="w-5 h-5" style={{ color: '#002366' }} />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: '#002366' }}>
            {isEditing ? 'Modifier l\'agence' : 'Nouvelle agence'}
          </h3>
          <p className="text-xs" style={{ color: '#708090' }}>
            {isEditing ? `ID: ${agence?.id.slice(0, 8)}...` : 'Remplissez les informations ci-dessous'}
          </p>
        </div>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Code agence" required error={errors.code?.message}>
          <input
            {...register('code')}
            placeholder="EX: AGC-ABJ-001"
            className={inputClass(!!errors.code)}
            style={{ color: '#002366' }}
          />
        </Field>

        <Field label="Nom de l'agence" required error={errors.nom?.message}>
          <input
            {...register('nom')}
            placeholder="Agence principale Abidjan"
            className={inputClass(!!errors.nom)}
            style={{ color: '#002366' }}
          />
        </Field>

        <Field label="Ville" required error={errors.ville?.message}>
          <input
            {...register('ville')}
            placeholder="Abidjan"
            className={inputClass(!!errors.ville)}
            style={{ color: '#002366' }}
          />
        </Field>

        <Field label="Téléphone" required error={errors.telephone?.message}>
          <input
            {...register('telephone')}
            type="tel"
            placeholder="+225 07 00 00 00 00"
            className={inputClass(!!errors.telephone)}
            style={{ color: '#002366' }}
          />
        </Field>

        <Field label="Adresse complète" required error={errors.adresse?.message}>
          <input
            {...register('adresse')}
            placeholder="Plateau, Rue des Jardins, Imm. 12"
            className={cn(inputClass(!!errors.adresse), 'sm:col-span-2')}
            style={{ color: '#002366' }}
          />
        </Field>

        <Field label="Email (optionnel)" error={errors.email?.message}>
          <input
            {...register('email')}
            type="email"
            placeholder="agence@vsn-ci.com"
            className={inputClass(!!errors.email)}
            style={{ color: '#002366' }}
          />
        </Field>
      </div>

      {/* Actions */}
      <div
        className="flex items-center justify-end gap-3 pt-4"
        style={{ borderTop: '1px solid rgba(0,35,102,0.08)' }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={mutation.isPending}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-gray-100 disabled:opacity-50"
            style={{ color: '#708090' }}
          >
            Annuler
          </button>
        )}
        <button
          type="submit"
          disabled={mutation.isPending || (!isDirty && isEditing)}
          className={cn(
            'px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-150',
            'flex items-center gap-2',
            'hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          style={{ background: 'linear-gradient(135deg, #002366, #002f8a)' }}
        >
          {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEditing ? 'Enregistrer les modifications' : 'Créer l\'agence'}
        </button>
      </div>
    </form>
  );
}
