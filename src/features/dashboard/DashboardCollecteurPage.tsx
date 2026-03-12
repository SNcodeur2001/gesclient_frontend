import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuthStore } from '../../store/authStore'
import api from '../../lib/axios'
import type { CollecteResponseDto } from '../../types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function formatKg(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' kg'
}

function formatNumber(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n)
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCollecteurDashboard() {
  return useQuery({
    queryKey: ['collectes', 'dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/collectes', { params: { page: 1, limit: 5 } })
      const raw = data?.data
      const items: CollecteResponseDto[] = [...(raw?.items ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      return {
        items,
        total: raw?.total ?? 0,
        tonnageTotal: raw?.tonnageTotal ?? 0,
        montantTotal: raw?.montantTotal ?? 0,
      }
    },
    staleTime: 1000 * 60 * 2,
  })
}

function useCollecteurEvolution() {
  // Calcul des 6 derniers mois
  const now = new Date()
  const dateDebut = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    .toISOString().split('T')[0]
  const dateFin = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString().split('T')[0]

  return useQuery({
    queryKey: ['collectes', 'evolution'],
    queryFn: async () => {
      const { data } = await api.get('/collectes', {
        params: { page: 1, limit: 200, dateDebut, dateFin }
      })
      const items: CollecteResponseDto[] = data?.data?.items ?? []

      // Générer le squelette des 6 derniers mois
      const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
                         'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
      const skeleton: Record<string, number> = {}
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        skeleton[key] = 0
      }

      // Remplir avec les vraies données
      items.forEach((c) => {
        const d = new Date(c.createdAt)
        const key = `${d.getFullYear()}-${d.getMonth()}`
        if (key in skeleton) {
          const kg = c.items?.reduce((s, i) => s + i.quantiteKg, 0) ?? c.quantiteKg ?? 0
          skeleton[key] += kg
        }
      })

      // Transformer en tableau pour recharts
      return Object.entries(skeleton).map(([key, tonnage]) => {
        const [, month] = key.split('-').map(Number)
        return { mois: MONTHS_FR[month], tonnage }
      })
    },
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
      <div className="h-8 bg-slate-100 rounded w-2/3" />
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-800 text-white text-xs py-1.5 px-2.5 rounded shadow">
      <p className="text-slate-300 mb-0.5">{label}</p>
      <p className="font-bold">{formatKg(payload[0].value)}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardCollecteurPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [periode, setPeriode] = useState<'semaine' | 'mois'>('mois')

  const { data, isLoading } = useCollecteurDashboard()
  const { data: chartData = [], isLoading: chartLoading } = useCollecteurEvolution()

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const tonnageTotal = data?.tonnageTotal ?? 0
  const montantTotal = data?.montantTotal ?? 0

  return (
    <PageLayout title="Tableau de bord">
      <div className="space-y-8">

        {/* ── Bienvenue ── */}
        <section>
          <h1 className="text-3xl font-bold text-slate-900">
            Bienvenue, {user?.prenom} {user?.nom}
          </h1>
          <p className="text-slate-500 mt-1">
            Voici le résumé de vos activités de collecte aujourd'hui.
          </p>
        </section>

        {/* ── KPI Cards ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Total Collectes</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{formatNumber(total)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Poids total</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{formatKg(tonnageTotal)}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Montant total</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{formatFCFA(montantTotal)}</p>
              </div>
            </>
          )}
        </section>

        {/* ── Graphique ── */}
        <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-slate-800">
              Mes collectes dans le temps
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setPeriode('semaine')}
                className={`px-3 py-1 text-xs font-medium border rounded transition-colors ${
                  periode === 'semaine'
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setPeriode('mois')}
                className={`px-3 py-1 text-xs font-medium border rounded transition-colors ${
                  periode === 'mois'
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Mois
              </button>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-64 bg-slate-50 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradCollecte" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar
                  dataKey="tonnage"
                  fill="url(#gradCollecte)"
                  stroke="#2563EB"
                  strokeWidth={2}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* ── Collectes récentes ── */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Collectes récentes</h3>
            <button
              onClick={() => navigate('/collectes')}
              className="text-[#2563EB] text-xs font-semibold hover:underline"
            >
              Voir tout
            </button>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">
                Aucune collecte récente
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Apporteur</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Poids (kg)</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Montant (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((c) => {
                    const totalKg = c.items?.reduce((s, i) => s + i.quantiteKg, 0) ?? c.quantiteKg ?? 0
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/collectes/${c.id}`)}
                      >
                        <td className="px-6 py-4 text-slate-600">{formatDateLong(c.createdAt)}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{c.apporteur?.nom ?? '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{formatNumber(totalKg)} kg</td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatFCFA(c.montantTotal)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
    </PageLayout>
  )
}