'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Adresse email invalide'),
  motDePasse: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: data.email,
        motDePasse: data.motDePasse,
      });

      const { otpRequis, userId, user, accessToken, refreshToken } = res.data;

      if (otpRequis) {
        router.push(`/otp?userId=${userId}`);
        return;
      }

      setAuth(user, accessToken, refreshToken);
      toast.success('Connexion réussie', { description: `Bienvenue, ${user.prenom} !` });
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message =
        error?.response?.data?.message ?? 'Identifiants incorrects. Veuillez réessayer.';
      toast.error('Erreur de connexion', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: 'rgba(241, 110, 0, 0.15)', border: '1px solid rgba(241, 110, 0, 0.3)' }}>
          <Wallet className="w-8 h-8" style={{ color: '#F16E00' }} />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">VSN-CI</h1>
        <p className="text-sm font-medium mt-1" style={{ color: '#708090' }}>Mobile Money Platform</p>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 shadow-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Card header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4" style={{ color: '#F16E00' }} />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F16E00' }}>
              Espace Sécurisé
            </span>
          </div>
          <h2 className="text-xl font-semibold text-white">Connexion</h2>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Entrez vos identifiants pour accéder à la plateforme
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80" htmlFor="email">
              Adresse email
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="votre@email.com"
                {...register('email')}
                className={cn(
                  'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all',
                  'focus:ring-2',
                  errors.email
                    ? 'ring-1 ring-red-500/60 focus:ring-red-500/60'
                    : 'focus:ring-orange-500/40',
                )}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400 flex items-center gap-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/80" htmlFor="motDePasse">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="motDePasse"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('motDePasse')}
                className={cn(
                  'w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all',
                  'focus:ring-2',
                  errors.motDePasse
                    ? 'ring-1 ring-red-500/60 focus:ring-red-500/60'
                    : 'focus:ring-orange-500/40',
                )}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors hover:bg-white/10"
              >
                {showPassword
                  ? <EyeOff className="w-4 h-4 text-white/40" />
                  : <Eye className="w-4 h-4 text-white/40" />}
              </button>
            </div>
            {errors.motDePasse && (
              <p className="text-xs text-red-400">{errors.motDePasse.message}</p>
            )}
          </div>

          {/* Forgot password */}
          <div className="flex justify-end">
            <button type="button" className="text-xs transition-colors hover:opacity-80" style={{ color: '#F16E00' }}>
              Mot de passe oublié ?
            </button>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              'w-full py-3 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200',
              'flex items-center justify-center gap-2',
              'hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            style={{ background: 'linear-gradient(135deg, #F16E00, #d45f00)' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
        © {new Date().getFullYear()} VSN-CI Mobile Money. Tous droits réservés.
      </p>
    </div>
  );
}
