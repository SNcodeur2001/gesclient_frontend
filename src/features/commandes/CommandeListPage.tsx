import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/ui/Badge'
import { useCommandes } from './hooks/useCommandes'
import { useAuthStore } from '../../store/authStore'
import type { CommandeListParams } from './api/commandes.api'
import type { CommandeStatut, CommandeType } from '../../types'
import {
  Search, Plus, RefreshCw, Eye, Calendar,
  MoreVertical, ChevronRight,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

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

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  page, totalPages, total, limit, onPageChange,
}: {
  page: number; totalPages: number; total: number
  limit: number; onPageChange: (p: number) => void
}) {
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const pages = Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
    if (totalPages <= 3) return i + 1
    if (page <= 2) return i + 1
    if (page >= totalPages - 1) return totalPages - 2 + i
    return page - 1 + i
  })

  return (
    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
      <p className="text-sm text-slate-500">
        Affichage de{' '}
        <span className="font-medium text-slate-900">{from}</span> à{' '}
        <span className="font-medium text-slate-900">{to}</span> sur{' '}
        <span className="font-medium text-slate-900">{total}</span> commandes
      </p>
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
              p === page
                ? 'bg-[#2563EB] border-[#2563EB] text-white'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
        {totalPages > 3 && page < totalPages - 1 && (
          <span className="px-2 text-slate-300">...</span>
        )}
        {page < totalPages && (
          <button
            onClick={() => onPageChange(page + 1)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 flex items-center gap-1 transition-colors"
          >
            Suivant <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CommandesListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const canCreate = user?.role !== 'DIRECTEUR'
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [params, setParams] = useState<CommandeListParams>({
    page: 1, limit: 8,
    search: '', statut: undefined, type: undefined,
  })
  const [searchVal, setSearchVal] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  const { data, isLoading, refetch } = useCommandes(params)

  // Recherche avec debounce 400ms
  const handleSearch = useCallback((val: string) => {
    setSearchVal(val)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setParams(p => ({ ...p, search: val, page: 1 }))
    }, 400)
  }, [])

  const handleReset = () => {
    setSearchVal('')
    setDateDebut('')
    setDateFin('')
    setParams({ page: 1, limit: 10, search: '', statut: undefined, type: undefined })
    refetch()
  }

  return (
    <PageLayout title="Liste des Commandes">
      <div className="space-y-6">

        {/* ── Titre + bouton ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Commandes</h1>
            <p className="text-slate-500 mt-1 text-sm">
              Gérez vos transactions et suivez l'état des livraisons.
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => navigate('/commandes/nouveau')}
              className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm text-sm"
            >
              <Plus size={16} />
              Nouvelle commande
            </button>
          )}
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="flex-1 min-w-[220px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Référence ou produit..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
            />
          </div>

          {/* Statut */}
          <select
            value={params.statut ?? ''}
            onChange={(e) => setParams(p => ({
              ...p,
              statut: e.target.value as CommandeStatut || undefined,
              page: 1,
            }))}
            className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-3 text-slate-600 outline-none focus:ring-2 focus:ring-[#2563EB] min-w-[160px] cursor-pointer"
          >
            <option value="">Tous les statuts</option>
            <option value="EN_PREPARATION">En préparation</option>
            <option value="PRETE">Prête</option>
            <option value="EN_ATTENTE_ACOMPTE">En attente acompte</option>
            <option value="FINALISEE">Finalisée</option>
            <option value="ANNULEE">Annulée</option>
          </select>

          {/* Type */}
          <select
            value={params.type ?? ''}
            onChange={(e) => setParams(p => ({
              ...p,
              type: e.target.value as CommandeType || undefined,
              page: 1,
            }))}
            className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-3 text-slate-600 outline-none focus:ring-2 focus:ring-[#2563EB] min-w-[140px] cursor-pointer"
          >
            <option value="">Tous les types</option>
            <option value="A_DISTANCE">À distance</option>
            <option value="SUR_PLACE">Sur place</option>
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-500">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => {
                setDateDebut(e.target.value)
                setParams(p => ({ ...p, dateDebut: e.target.value || undefined, page: 1 }))
              }}
              className="bg-transparent outline-none text-xs w-28"
            />
            <span className="text-slate-300">→</span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => {
                setDateFin(e.target.value)
                setParams(p => ({ ...p, dateFin: e.target.value || undefined, page: 1 }))
              }}
              className="bg-transparent outline-none text-xs w-28"
            />
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            title="Réinitialiser les filtres"
            className="p-2 text-slate-500 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* ── Tableau ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Référence', 'Client', 'Type', 'Montant TTC', 'Statut', 'Date', ''].map((h, i) => (
                    <th
                      key={i}
                      className={`px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 6 ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : !data?.items.length
                  ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-14 text-center text-slate-400 text-sm">
                        Aucune commande trouvée
                      </td>
                    </tr>
                  )
                  : data.items.map((cmd) => (
                    <tr
                      key={cmd.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => navigate(`/commandes/${cmd.id}`)}
                    >
                      {/* Référence */}
                      <td className="px-6 py-4 font-medium text-[#2563EB] text-sm">
                        {cmd.reference ?? `CMD-${cmd.id.slice(0, 8).toUpperCase()}`}
                      </td>

                      {/* Client */}
                      <td className="px-6 py-4 text-slate-700 text-sm">
                        {cmd.acheteur?.nom ?? '—'}
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <Badge variant={cmd.type} />
                      </td>

                      {/* Montant */}
                      <td className="px-6 py-4 font-semibold text-slate-800 text-sm">
                        {formatFCFA(cmd.montantTTC)}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        <Badge variant={cmd.statut} />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-500 text-sm">
                        {formatDate(cmd.createdAt)}
                      </td>

                      {/* Actions */}
                      <td
                        className="px-6 py-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <button
                            onClick={() => navigate(`/commandes/${cmd.id}`)}
                            className="p-1.5 hover:text-[#2563EB] transition-colors rounded"
                            title="Voir"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="p-1.5 hover:text-[#2563EB] transition-colors rounded"
                            title="Planifier"
                          >
                            <Calendar size={16} />
                          </button>
                          <button
                            className="p-1.5 hover:text-[#2563EB] transition-colors rounded"
                            title="Plus d'options"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > 0 && (
            <Pagination
              page={params.page ?? 1}
              totalPages={data.totalPages}
              total={data.total}
              limit={params.limit ?? 10}
              onPageChange={(p) => setParams(prev => ({ ...prev, page: p }))}
            />
          )}
        </div>

      </div>
    </PageLayout>
  )
}
