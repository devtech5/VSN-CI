import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color?: string;
  change?: number; // percentage, positive or negative
  subtitle?: string;
  loading?: boolean;
}

export function KpiCard({
  title,
  value,
  icon: Icon,
  color = '#002366',
  change,
  subtitle,
  loading = false,
}: KpiCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  if (loading) {
    return (
      <div
        className="rounded-2xl p-5 animate-pulse"
        style={{ background: 'white', border: '1px solid rgba(0,35,102,0.06)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl" style={{ background: '#f0f0f0' }} />
          <div className="w-16 h-5 rounded-full" style={{ background: '#f0f0f0' }} />
        </div>
        <div className="w-24 h-4 rounded mb-2" style={{ background: '#f0f0f0' }} />
        <div className="w-32 h-7 rounded" style={{ background: '#f0f0f0' }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 group"
      style={{
        background: 'white',
        border: '1px solid rgba(0,35,102,0.06)',
        boxShadow: '0 1px 4px rgba(0,35,102,0.04)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}12` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>

        {/* Change badge */}
        {change !== undefined && (
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
            )}
            style={{
              background: isPositive
                ? 'rgba(22, 163, 74, 0.1)'
                : isNegative
                  ? 'rgba(220, 38, 38, 0.1)'
                  : 'rgba(112, 128, 144, 0.1)',
              color: isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#708090',
            }}
          >
            {isPositive && <TrendingUp className="w-3 h-3" />}
            {isNegative && <TrendingDown className="w-3 h-3" />}
            {isNeutral && <Minus className="w-3 h-3" />}
            <span>
              {isPositive ? '+' : ''}
              {change.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-sm font-medium mb-1" style={{ color: '#708090' }}>
        {title}
      </p>

      {/* Value */}
      <p className="text-2xl font-bold tracking-tight" style={{ color: '#002366' }}>
        {value}
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs mt-1" style={{ color: '#708090' }}>
          {subtitle}
        </p>
      )}

      {/* Bottom accent bar */}
      <div className="mt-4 h-0.5 rounded-full overflow-hidden" style={{ background: `${color}12` }}>
        <div
          className="h-full rounded-full transition-all duration-500 group-hover:w-full"
          style={{ background: color, width: '40%' }}
        />
      </div>
    </div>
  );
}
