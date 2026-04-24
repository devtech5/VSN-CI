'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Shield, Bell, Save } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Switch manuel simple (sans dépendance supplémentaire)
function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-[#002366]' : 'bg-gray-200'}`}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function ParametresPage() {
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [securite, setSecurite] = useState({
    otpActif: true,
    dureeOtpMinutes: 5,
    tentativesMaxLogin: 5,
    dureeSessionHeures: 8,
  });

  const [notifications, setNotifications] = useState({
    alerteSmsActif: true,
    alerteEmailActif: true,
  });

  const handleSave = () => {
    localStorage.setItem('vsn-parametres-securite', JSON.stringify(securite));
    localStorage.setItem('vsn-parametres-notifications', JSON.stringify(notifications));
    toast.success('Paramètres enregistrés avec succès');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[#002366]">Paramètres de Sécurité</h1>
        <p className="text-sm text-gray-500 mt-1">Configurez les règles de sécurité de la plateforme</p>
      </div>

      {/* Sécurité */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-[#002366]" />
          <h2 className="font-semibold text-gray-900">Authentification</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Vérification OTP</p>
            <p className="text-xs text-gray-500">Exiger un code SMS à chaque connexion</p>
          </div>
          <Switch checked={securite.otpActif} onChange={v => setSecurite(s => ({ ...s, otpActif: v }))} />
        </div>

        {securite.otpActif && (
          <div className="pl-0 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Durée de validité OTP (minutes)</Label>
              <Input type="number" min={1} max={30} className="w-32"
                value={securite.dureeOtpMinutes}
                onChange={e => setSecurite(s => ({ ...s, dureeOtpMinutes: Number(e.target.value) }))}
                disabled={!isSuperAdmin} />
            </div>
          </div>
        )}

        <div className="h-px bg-gray-100" />

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Tentatives max avant blocage</Label>
            <Input type="number" min={1} max={10} className="w-32"
              value={securite.tentativesMaxLogin}
              onChange={e => setSecurite(s => ({ ...s, tentativesMaxLogin: Number(e.target.value) }))}
              disabled={!isSuperAdmin} />
            <p className="text-xs text-gray-400">Nombre de tentatives de connexion échouées avant blocage du compte</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Durée de session (heures)</Label>
            <Input type="number" min={1} max={24} className="w-32"
              value={securite.dureeSessionHeures}
              onChange={e => setSecurite(s => ({ ...s, dureeSessionHeures: Number(e.target.value) }))}
              disabled={!isSuperAdmin} />
            <p className="text-xs text-gray-400">Déconnexion automatique après inactivité</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-[#002366]" />
          <h2 className="font-semibold text-gray-900">Notifications</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Alertes SMS</p>
            <p className="text-xs text-gray-500">Recevoir des alertes par SMS pour les opérations critiques</p>
          </div>
          <Switch checked={notifications.alerteSmsActif}
            onChange={v => setNotifications(n => ({ ...n, alerteSmsActif: v }))} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">Alertes Email</p>
            <p className="text-xs text-gray-500">Recevoir des alertes par email pour les transactions importantes</p>
          </div>
          <Switch checked={notifications.alerteEmailActif}
            onChange={v => setNotifications(n => ({ ...n, alerteEmailActif: v }))} />
        </div>
      </div>

      {/* Bouton Save */}
      {isSuperAdmin && (
        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[#002366] hover:bg-[#001a4d] text-white gap-2">
            <Save className="w-4 h-4" /> Enregistrer les paramètres
          </Button>
        </div>
      )}
    </div>
  );
}
