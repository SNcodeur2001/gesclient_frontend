import { useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { useCollectes } from './hooks/usecollectes'
import { useAuthStore } from '../../store/authStore'
import type { CollecteListParams } from './api/collectes.api'
import type { CollecteResponseDto, CollecteItemResponse } from '../../types'
import {
  Search, Calendar, Download, ArrowUpDown,
  Eye, MoreVertical, Scale, Banknote, PlusCircle,
  ChevronLeft, ChevronRight,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function fmtKg(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' kg'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  icon, iconBg, label, value,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
}) {
  return (
    <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center gap-4 shadow-sm">
      <div className={`size-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-slate-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CollectesListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canCreate = user?.role !== 'DIRECTEUR'
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [params, setParams] = useState<CollecteListParams>({
    page: 1, limit: 6, search: '',
  })
  const [searchVal, setSearchVal] = useState('')

  const { data, isLoading } = useCollectes(params)
  const filters = useMemo(() => ({
    search: params.search,
    dateDebut: params.dateDebut,
    dateFin: params.dateFin,
  }), [params.search, params.dateDebut, params.dateFin])
  const totalsParams = useMemo(
    () => ({ ...filters, page: 1, limit: 1 }),
    [filters]
  )
  const { data: totalsData, isLoading: totalsLoading } = useCollectes(totalsParams)

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const todayParams = useMemo(
    () => ({ ...filters, dateDebut: today, dateFin: today, page: 1, limit: 1 }),
    [filters, today]
  )
  const { data: todayData, isLoading: todayLoading } = useCollectes(todayParams)

  // Recherche debounce
  const handleSearch = useCallback((val: string) => {
    setSearchVal(val)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setParams(p => ({ ...p, search: val, page: 1 }))
    }, 400)
  }, [])

  // Filtre 30 derniers jours
  const handleLast30Days = () => {
    const dateFin = new Date().toISOString().split('T')[0]
    const dateDebut = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]
    setParams(p => ({ ...p, dateDebut, dateFin, page: 1 }))
  }

  const from = ((params.page ?? 1) - 1) * (params.limit ?? 10) + 1
  const to = Math.min((params.page ?? 1) * (params.limit ?? 10), data?.total ?? 0)

  return (
    <PageLayout title="Liste des Collectes">
      <div className="space-y-6">

        {/* ── Titre + bouton ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestion des Collectes</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Consultez et gérez les apports de matières plastiques.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => navigate('/collectes/nouveau')}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              <PlusCircle size={16} />
              Nouvelle collecte
            </button>
          )}
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            {/* Recherche */}
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchVal}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Rechercher un apporteur ou ID..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
              />
            </div>

            {/* 30 jours */}
            <button
              onClick={handleLast30Days}
              className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Calendar size={14} className="text-slate-400" />
              Derniers 30 jours
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              title="Exporter"
              className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <Download size={16} />
            </button>
            <button
              title="Trier"
              className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        {/* ── Tableau ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  {['ID Collecte', 'Apporteur', 'Date', 'Poids Total', 'Montant', 'Collecteur', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-4 ${i === 6 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : !data?.items.length
                  ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center text-slate-400 text-sm">
                        Aucune collecte trouvée
                      </td>
                    </tr>
                  )
                  : data.items.map((col: CollecteResponseDto) => {
                    const totalKg = col.items?.reduce((s: number, i: CollecteItemResponse) => s + i.quantiteKg, 0)
                      ?? col.quantiteKg ?? 0

                    return (
                      <tr
                        key={col.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* ID */}
                        <td
                          className="px-6 py-4 font-medium text-[#2563EB] cursor-pointer hover:underline text-sm"
                          onClick={() => navigate(`/collectes/${col.id}`)}
                        >
                          {col.notes ?? `COL-${col.id.slice(0, 8).toUpperCase()}`}
                        </td>

                        {/* Apporteur */}
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {col.apporteur?.nom ?? '—'}
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {fmtDate(col.createdAt)}
                        </td>

                        {/* Poids */}
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">
                          {fmtKg(totalKg)}
                        </td>

                        {/* Montant */}
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                          {fmt(col.montantTotal)}
                        </td>

                        {/* Collecteur */}
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {col.collecteur
                            ? `${col.collecteur.prenom ?? ''} ${col.collecteur.nom}`.trim()
                            : '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 text-slate-400">
                            <button
                              onClick={() => navigate(`/collectes/${col.id}`)}
                              className="p-1.5 hover:text-[#2563EB] transition-colors rounded"
                              title="Voir"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className="p-1.5 hover:text-slate-700 transition-colors rounded"
                              title="Plus"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                }
              </tbody>
            </table>
          </div>

          {/* Pagination simple */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {data?.total
                ? `Affichage de ${from} à ${to} sur ${data.total} collectes`
                : 'Aucune collecte'
              }
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) - 1 }))}
                disabled={(params.page ?? 1) <= 1}
                className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <button
                onClick={() => setParams(p => ({ ...p, page: (p.page ?? 1) + 1 }))}
                disabled={(params.page ?? 1) >= (data?.totalPages ?? 1)}
                className="flex items-center gap-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SummaryCard
            icon={<Scale size={20} className="text-[#2563EB]" />}
            iconBg="bg-blue-100"
            label="Poids Total Collecté"
            value={(isLoading || totalsLoading) ? '...' : fmtKg(totalsData?.tonnageTotal ?? 0)}
          />
          <SummaryCard
            icon={<Banknote size={20} className="text-green-600" />}
            iconBg="bg-green-100"
            label="Montant Total Versé"
            value={(isLoading || totalsLoading) ? '...' : fmt(totalsData?.montantTotal ?? 0)}
          />
          <SummaryCard
            icon={<PlusCircle size={20} className="text-blue-600" />}
            iconBg="bg-blue-100"
            label="Nouvelles Collectes (auj.)"
            value={(isLoading || todayLoading) ? '...' : String(todayData?.total ?? 0)}
          />
        </div>

      </div>
    </PageLayout>
  )
}
