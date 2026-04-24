'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  ArrowLeftRight,
  Wallet,
  UserCog,
  Network,
  Settings,
  Wallet2,
  LogOut,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, type Role } from '@/store/auth.store';
import { toast } from 'sonner';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER'],
  },
  {
    href: '/agences',
    label: 'Agences',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'],
  },
  {
    href: '/agents',
    label: 'Agents',
    icon: Users,
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'],
  },
  {
    href: '/transactions',
    label: 'Transactions',
    icon: ArrowLeftRight,
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE', 'AGENT', 'CAISSIER'],
  },
  {
    href: '/finance',
    label: 'Finance',
    icon: Wallet,
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'],
  },
  {
    href: '/rh',
    label: 'RH',
    icon: UserCog,
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'],
  },
  {
    href: '/reseaux',
    label: 'Réseaux',
    icon: Network,
    roles: ['SUPER_ADMIN'],
  },
  {
    href: '/parametres',
    label: 'Paramètres',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ADMIN_AGENCE'],
  },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const filteredItems = NAV_ITEMS.filter(
    (item) => user?.role && item.roles.includes(user.role),
  );

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const initials = user
    ? `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()
    : 'U';

  const roleLabel: Record<Role, string> = {
    SUPER_ADMIN: 'Super Administrateur',
    ADMIN_AGENCE: 'Admin Agence',
    AGENT: 'Agent',
    CAISSIER: 'Caissier',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 h-full flex flex-col transition-transform duration-300',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          width: 240,
          background: 'linear-gradient(180deg, #001a4d 0%, #002366 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Logo */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-9 h-9 rounded-xl flex-shrink-0"
              style={{ background: 'rgba(241, 110, 0, 0.15)', border: '1px solid rgba(241, 110, 0, 0.3)' }}
            >
              <Wallet2 className="w-5 h-5" style={{ color: '#F16E00' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white truncate">VSN-CI</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Mobile Money
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p
            className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.25)' }}
          >
            Navigation
          </p>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                  active
                    ? 'text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5',
                )}
                style={
                  active
                    ? {
                        background: 'rgba(241, 110, 0, 0.12)',
                        borderLeft: '3px solid #F16E00',
                        paddingLeft: '9px',
                      }
                    : {}
                }
              >
                <Icon
                  className={cn('w-4 h-4 flex-shrink-0 transition-colors', active ? '' : 'group-hover:text-white/80')}
                  style={active ? { color: '#F16E00' } : {}}
                />
                <span className="truncate">{item.label}</span>
                {active && (
                  <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0" style={{ color: '#F16E00' }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="px-3 pb-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #F16E00, #d45f00)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {user?.role ? roleLabel[user.role] : ''}
              </p>
            </div>
            <button
              onClick={handleLogout}
              title="Se déconnecter"
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/20 flex-shrink-0 group"
            >
              <LogOut className="w-3.5 h-3.5 text-white/30 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
