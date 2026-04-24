'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Bell, Menu, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick?: () => void;
}

const PAGE_TITLES: Record<string, { title: string; breadcrumb: string[] }> = {
  '/dashboard': { title: 'Dashboard', breadcrumb: ['Accueil', 'Dashboard'] },
  '/agences': { title: 'Agences', breadcrumb: ['Accueil', 'Agences'] },
  '/agents': { title: 'Agents', breadcrumb: ['Accueil', 'Agents'] },
  '/transactions': { title: 'Transactions', breadcrumb: ['Accueil', 'Transactions'] },
  '/finance': { title: 'Finance', breadcrumb: ['Accueil', 'Finance'] },
  '/rh': { title: 'Ressources Humaines', breadcrumb: ['Accueil', 'RH'] },
  '/reseaux': { title: 'Réseaux Mobile', breadcrumb: ['Accueil', 'Réseaux'] },
  '/parametres': { title: 'Paramètres', breadcrumb: ['Accueil', 'Paramètres'] },
};

function getPageInfo(pathname: string) {
  // Exact match
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];

  // Prefix match (e.g. /agences/123)
  for (const [key, value] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(key + '/')) {
      const segment = pathname.split('/')[2];
      const isId = segment && /^[a-z0-9-]{20,}$/i.test(segment);
      return {
        title: value.title,
        breadcrumb: [...value.breadcrumb, isId ? 'Détails' : segment],
      };
    }
  }

  return { title: 'VSN-CI', breadcrumb: ['Accueil'] };
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { title, breadcrumb } = getPageInfo(pathname);

  return (
    <header
      className="sticky top-0 z-10 h-16 flex items-center px-6 gap-4"
      style={{
        background: 'rgba(248, 249, 250, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0, 35, 102, 0.08)',
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className={cn(
          'p-2 rounded-xl transition-colors hover:bg-gray-100 lg:hidden flex-shrink-0',
        )}
        style={{ color: '#002366' }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title & Breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold truncate" style={{ color: '#002366' }}>
          {title}
        </h1>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 mt-0.5" aria-label="Breadcrumb">
          {breadcrumb.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index === 0 && <Home className="w-3 h-3" style={{ color: '#708090' }} />}
              <span
                className={cn(
                  'text-xs',
                  index === breadcrumb.length - 1
                    ? 'font-medium'
                    : 'hover:underline cursor-pointer',
                )}
                style={{
                  color: index === breadcrumb.length - 1 ? '#F16E00' : '#708090',
                }}
              >
                {crumb}
              </span>
              {index < breadcrumb.length - 1 && (
                <ChevronRight className="w-3 h-3" style={{ color: '#708090' }} />
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification bell */}
        <button
          className="relative p-2.5 rounded-xl transition-all duration-150 hover:bg-gray-100 group"
          title="Notifications"
        >
          <Bell className="w-5 h-5 transition-colors" style={{ color: '#708090' }} />
          {/* Notification badge */}
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ background: '#F16E00' }}
          />
        </button>
      </div>
    </header>
  );
}
