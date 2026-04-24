'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, ShieldCheck, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const OTP_LENGTH = 6;
const TIMER_SECONDS = 5 * 60; // 5 minutes

export default function OtpPageWrapper() {
  return (
    <Suspense fallback={null}>
      <OtpPage />
    </Suspense>
  );
}

function OtpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId') ?? '';
  const setAuth = useAuthStore((s) => s.setAuth);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [expired, setExpired] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setExpired(true);
      return;
    }
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setExpired(true);
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Format time MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];

    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, OTP_LENGTH - index);
      pasted.split('').forEach((char, i) => {
        if (index + i < OTP_LENGTH) newDigits[index + i] = char;
      });
      setDigits(newDigits);
      const nextIndex = Math.min(index + pasted.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newDigits = [...digits];
    pasted.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setDigits(newDigits);
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  const submitOtp = useCallback(async (code: string) => {
    if (code.length !== OTP_LENGTH || isLoading) return;
    setIsLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { userId, code });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Authentification réussie', { description: `Bienvenue, ${user.prenom} !` });
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error?.response?.data?.message ?? 'Code OTP invalide ou expiré.';
      toast.error('Erreur de vérification', { description: message });
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [userId, isLoading, setAuth, router]);

  // Auto-submit when all digits filled
  useEffect(() => {
    const code = digits.join('');
    if (code.length === OTP_LENGTH && !digits.includes('')) {
      submitOtp(code);
    }
  }, [digits, submitOtp]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/resend-otp', { userId });
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeLeft(TIMER_SECONDS);
      setExpired(false);
      inputRefs.current[0]?.focus();
      toast.success('Code renvoyé', { description: 'Un nouveau code OTP a été envoyé.' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message = error?.response?.data?.message ?? 'Impossible de renvoyer le code.';
      toast.error('Erreur', { description: message });
    } finally {
      setIsResending(false);
    }
  };

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const filledCount = digits.filter(Boolean).length;
  const progressPercent = (filledCount / OTP_LENGTH) * 100;

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
          style={{ background: 'rgba(241, 110, 0, 0.15)', border: '1px solid rgba(241, 110, 0, 0.3)' }}
        >
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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
            style={{ background: 'rgba(241, 110, 0, 0.1)' }}>
            <ShieldCheck className="w-6 h-6" style={{ color: '#F16E00' }} />
          </div>
          <h2 className="text-xl font-semibold text-white">Vérification en deux étapes</h2>
          <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Entrez le code à 6 chiffres envoyé sur votre appareil
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%`, background: '#F16E00' }}
          />
        </div>

        {/* OTP inputs */}
        <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading || expired}
              className={cn(
                'w-12 h-14 text-center text-xl font-bold text-white rounded-xl outline-none transition-all duration-200',
                'focus:ring-2 focus:scale-105',
                digit
                  ? 'ring-1'
                  : '',
                isLoading || expired ? 'opacity-40 cursor-not-allowed' : '',
              )}
              style={{
                background: digit
                  ? 'rgba(241, 110, 0, 0.15)'
                  : 'rgba(255, 255, 255, 0.08)',
                border: digit
                  ? '1px solid rgba(241, 110, 0, 0.5)'
                  : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: digit ? '0 0 12px rgba(241,110,0,0.2)' : 'none',
              }}
            />
          ))}
        </div>

        {/* Timer or expired state */}
        <div className="text-center mb-6">
          {expired ? (
            <div className="space-y-3">
              <p className="text-sm text-red-400 font-medium">Code expiré</p>
              <button
                onClick={handleResend}
                disabled={isResending}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  'hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
                )}
                style={{ background: 'linear-gradient(135deg, #F16E00, #d45f00)', color: 'white' }}
              >
                {isResending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Renvoyer le code
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: timeLeft < 60 ? '#ef4444' : '#F16E00' }}
              />
              <span
                className={cn(
                  'text-sm font-mono font-semibold',
                  timeLeft < 60 ? 'text-red-400' : 'text-white/70',
                )}
              >
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs text-white/40">avant expiration</span>
            </div>
          )}
        </div>

        {/* Submit button (manual trigger) */}
        <button
          onClick={() => submitOtp(digits.join(''))}
          disabled={isLoading || digits.includes('') || expired}
          className={cn(
            'w-full py-3 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200',
            'flex items-center justify-center gap-2',
            'hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
          )}
          style={{ background: 'linear-gradient(135deg, #002366, #002f8a)' }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Vérification...
            </>
          ) : (
            'Valider le code'
          )}
        </button>

        {/* Back to login */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="text-xs transition-colors hover:opacity-80"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>

      <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
        © {new Date().getFullYear()} VSN-CI Mobile Money. Tous droits réservés.
      </p>
    </div>
  );
}
