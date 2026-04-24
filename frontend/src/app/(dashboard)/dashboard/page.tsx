'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Wallet,
  Building2,
  Users,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
} from 'recharts';

import api from '@/lib/axios';
import { formatMontant, formatDate } from '@/lib/utils';
import type { DashboardOverview } from '@/types';
import { KpiCard } from '@/components/dashboard/KpiCard';

async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const { data } = await api.get('/dashboard/overview');
  return data;
}

// Custom tooltip for line chart
function CustomLineTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 shadow-xl text-sm"
      style={{ background: '#002366', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
    >
      <p className="font-semibold mb-1 opacity-70 text-xs">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="opacity-70">{p.name}:</span>
          <span className="font-bold">
            {p.name === 'Volume' ? formatMontant(p.value) : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="h-4 flex-1 rounded" style={{ background: '#f0f2f5' }} />
          <div className="h-4 w-24 rounded" style={{ background: '#f0f2f5' }} />
          <div className="h-4 w-20 rounded" style={{ background: '#f0f2f5' }} />
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: fetchDashboardOverview,
    refetchInterval: 60_000, // refresh every minute
  });

  const evolutionData = data?.evolution7Jours?.map((item) => ({
    date: formatDate(item.date),
    Transactions: item.nb,
    Volume: item.volume,
  })) ?? [];

  const repartitionData = data?.repartitionReseau?.map((r) => ({
    name: r.nom,
    Volume: r.volume,
    couleur: r.couleur,
  })) ?? [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-lg font-semibold" style={{ color: '#002366' }}>
          Erreur de chargement
        </p>
        <p className="text-sm" style={{ color: '#708090' }}>
          Impossible de charger les données du dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section title */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#708090' }}>
          Vue d&apos;ensemble
        </h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            loading={isLoading}
            title="Transactions du jour"
            value={data ? data.transactionsDuJour.toLocaleString('fr-CI') : '0'}
            icon={ArrowLeftRight}
            color="#002366"
            change={5.2}
            subtitle="vs hier"
          />
          <KpiCard
            loading={isLoading}
            title="Volume du jour"
            value={data ? formatMontant(data.volumeDuJour) : formatMontant(0)}
            icon={Wallet}
            color="#F16E00"
            change={12.4}
            subtitle="vs hier"
          />
          <KpiCard
            loading={isLoading}
            title="Agences actives"
            value={data ? data.nbAgences.toLocaleString('fr-CI') : '0'}
            icon={Building2}
            color="#708090"
          />
          <KpiCard
            loading={isLoading}
            title="Agents actifs"
            value={data ? data.nbAgents.toLocaleString('fr-CI') : '0'}
            icon={Users}
            color="#002366"
            change={-1.5}
            subtitle="vs mois dernier"
          />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Evolution chart */}
        <div
          className="xl:col-span-2 rounded-2xl p-5"
          style={{ background: 'white', border: '1px solid rgba(0,35,102,0.06)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: '#002366' }}>
                Évolution des 7 derniers jours
              </h3>
              <p className="text-xs mt-0.5" style={{ color: '#708090' }}>
                Nombre de transactions et volume
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="h-52 rounded-xl animate-pulse" style={{ background: '#f0f2f5' }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,35,102,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#708090' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#708090' }}
                  tickLine={false}
                  axisLine={false}
                  width={35}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#F16E00' }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Transactions"
                  stroke="#002366"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#002366', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Volume"
                  stroke="#F16E00"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#F16E00', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Réseau repartition */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'white', border: '1px solid rgba(0,35,102,0.06)' }}
        >
          <div className="mb-5">
            <h3 className="font-semibold text-sm" style={{ color: '#002366' }}>
              Répartition par réseau
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#708090' }}>
              Volume par opérateur
            </p>
          </div>

          {isLoading ? (
            <div className="h-52 rounded-xl animate-pulse" style={{ background: '#f0f2f5' }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={repartitionData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,35,102,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#708090' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#708090' }}
                  tickLine={false}
                  axisLine={false}
                  width={50}
                />
                <Tooltip
                  formatter={(value) => [formatMontant(Number(value)), 'Volume']}
                  contentStyle={{
                    background: '#002366',
                    border: 'none',
                    borderRadius: 12,
                    color: 'white',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="Volume" radius={[0, 6, 6, 0]}>
                  {repartitionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.couleur} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top agences table */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'white', border: '1px solid rgba(0,35,102,0.06)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: '#002366' }}>
              Top 5 Agences
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#708090' }}>
              Par volume de transactions
            </p>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,35,102,0.06)' }}>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#708090' }}>
                    #
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#708090' }}>
                    Agence
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: '#708090' }}>
                    Volume
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wider hidden sm:table-cell" style={{ color: '#708090' }}>
                    Part
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data?.topAgences?.slice(0, 5).map((agence, index) => {
                  const totalVolume = data.topAgences.reduce((s, a) => s + a.volume, 0);
                  const pct = totalVolume ? ((agence.volume / totalVolume) * 100).toFixed(1) : '0';
                  return (
                    <tr key={agence.agenceId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 pr-4">
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                          style={{
                            background: index === 0 ? 'rgba(241,110,0,0.12)' : 'rgba(0,35,102,0.06)',
                            color: index === 0 ? '#F16E00' : '#708090',
                          }}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3">
                        <p className="font-medium" style={{ color: '#002366' }}>{agence.nom}</p>
                      </td>
                      <td className="py-3 text-right font-semibold" style={{ color: '#002366' }}>
                        {formatMontant(agence.volume)}
                      </td>
                      <td className="py-3 text-right hidden sm:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,35,102,0.08)' }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: '#F16E00' }}
                            />
                          </div>
                          <span className="text-xs w-10 text-right" style={{ color: '#708090' }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!data?.topAgences || data.topAgences.length === 0) && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm" style={{ color: '#708090' }}>
                      Aucune donnée disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
