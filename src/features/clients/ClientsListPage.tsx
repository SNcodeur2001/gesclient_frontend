import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/ui/Badge'
import { useClients, useDeleteClient, useExportClients } from './hooks/useClients'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import type { ClientListParams, ClientType, ClientStatut } from '../../types'
import {
  Search, Plus, Download, Pencil, Trash2, TrendingUp,
  ChevronLeft, ChevronRight, Eye,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
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

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (p: number) => void
}

function Pagination({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
      <span className="text-sm text-slate-500">
        Affichage de <span className="font-medium text-slate-700">{from} à {to}</span> sur{' '}
        <span className="font-medium text-slate-700">{total}</span> clients
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="px-3 py-1 text-sm border border-slate-200 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <ChevronLeft size={14} /> Précédent
        </button>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`px-3 py-1 text-sm border rounded transition-colors ${
              p === page
                ? 'border-[#2563EB] bg-[#2563EB] text-white'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-1 text-sm border border-slate-200 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
        >
          Suivant <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Modal confirmation suppression ──────────────────────────────────────────

interface DeleteModalProps {
  nom: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function DeleteModal({ nom, onConfirm, onCancel, loading }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Supprimer le client</h3>
        <p className="text-sm text-slate-500 mb-6">
          Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-slate-700">{nom}</span> ?
          Cette action est irréversible.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ClientsListPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isDirecteur = user?.role === 'DIRECTEUR'
  const addToast = useToastStore((state) => state.addToast)

  // Filtre type forcé selon le rôle
  const forcedType: ClientType | undefined =
    user?.role === 'COLLECTEUR' ? 'APPORTEUR' :
    user?.role === 'COMMERCIAL' ? 'ACHETEUR' :
    undefined

  const [params, setParams] = useState<ClientListParams>({
    page: 1,
    limit: 6,
    search: '',
    type: forcedType,
    statut: undefined,
  })
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nom: string } | null>(null)

  const { data, isLoading } = useClients(params)
  const deleteMutation = useDeleteClient()
  const exportMutation = useExportClients()

  // Stats calculées depuis la liste
  const totalActifs = data?.items.filter(c => c.statut === 'ACTIF').length ?? 0
  // const totalProspects = data?.items.filter(c => c.statut === 'PROSPECT').length ?? 0
  const totalClients = data?.total ?? 0
  const tauxConversion = totalClients > 0
    ? Math.round((totalActifs / totalClients) * 100)
    : 0
  const revenuCumule = data?.items.reduce((s, c) => s + (c.totalRevenue ?? 0), 0) ?? 0

  // Recherche avec debounce simple
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setParams(p => ({ ...p, search: value, page: 1 }))
  }, [])

  const handleTypeFilter = (value: string) => {
    setParams(p => ({
      ...p,
      type: value === '' ? undefined : value as ClientType,
      page: 1,
    }))
  }

  const handleStatutFilter = (value: string) => {
    setParams(p => ({
      ...p,
      statut: value === '' ? undefined : value as ClientStatut,
      page: 1,
    }))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      addToast('Client supprimé avec succès', 'success')
      setDeleteTarget(null)
    } catch (error) {
      addToast('Erreur lors de la suppression', 'error')
    }
  }

  const handleExport = () => {
    exportMutation.mutate({ type: params.type, statut: params.statut })
    addToast('Export en cours de préparation...', 'info')
  }

  return (
    <PageLayout title="Liste des Clients">
      <div className="space-y-6">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Clients Actifs */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Total Clients Actifs</p>
            <div className="mt-2 flex items-end justify-between">
              <h2 className="text-3xl font-bold text-slate-900">
                {isLoading ? <span className="animate-pulse bg-slate-100 rounded w-12 h-8 block" /> : data?.total ?? 0}
              </h2>
              <span className="text-green-600 text-xs font-semibold flex items-center gap-0.5 mb-1">
                <TrendingUp size={14} /> +{totalActifs} actifs
              </span>
            </div>
          </div>

          {/* Taux Conversion */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Taux Conversion Prospects</p>
            <div className="mt-2">
              <h2 className="text-3xl font-bold text-slate-900">{tauxConversion}%</h2>
              <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                <div
                  className="bg-[#2563EB] h-full rounded-full transition-all duration-500"
                  style={{ width: `${tauxConversion}%` }}
                />
              </div>
            </div>
          </div>

          {/* Revenu Cumulé */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Revenu Cumulé Clients</p>
            <div className="mt-2">
              <h2 className="text-3xl font-bold text-slate-900">
                {isLoading
                  ? <span className="animate-pulse bg-slate-100 rounded w-32 h-8 block" />
                  : formatFCFA(revenuCumule)
                }
              </h2>
              <p className="text-slate-400 text-xs mt-1">Total facturé cette année</p>
            </div>
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="flex-1 min-w-[280px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un client..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition"
            />
          </div>

          {/* Filtre type — seulement pour le Directeur */}
          {!forcedType && (
            <select
              onChange={(e) => handleTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 cursor-pointer focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              <option value="">Tous les types</option>
              <option value="APPORTEUR">Apporteur</option>
              <option value="ACHETEUR">Acheteur</option>
            </select>
          )}

          {/* Filtre statut */}
          <select
            onChange={(e) => handleStatutFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg px-3 py-2 cursor-pointer focus:ring-2 focus:ring-[#2563EB] outline-none"
          >
            <option value="">Tous les statuts</option>
            <option value="ACTIF">Actif</option>
            <option value="PROSPECT">Prospect</option>
            <option value="INACTIF">Inactif</option>
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50 ml-auto"
          >
            <Download size={16} />
            {exportMutation.isPending ? 'Export...' : 'Exporter'}
          </button>

          {/* Ajouter */}
          <button
            onClick={() => navigate('/clients/nouveau')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
          >
            <Plus size={16} />
            Ajouter un client
          </button>
        </div>

        {/* ── Tableau ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Téléphone</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenu total</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : data?.items.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">
                        Aucun client trouvé
                      </td>
                    </tr>
                  )
                  : data?.items.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {client.nom} {client.prenom ?? ''}
                        </div>
                        <div className="text-xs text-slate-400">{client.id.slice(0, 6).toUpperCase()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={client.type} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {client.telephone ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {client.email ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={client.statut} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {client.totalRevenue > 0
                          ? formatFCFA(client.totalRevenue)
                          : <span className="text-slate-400">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/clients/${client.id}`)}
                            className="p-1.5 text-slate-400 hover:text-[#2563EB] transition-colors rounded"
                            title="Voir"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                            className="p-1.5 text-slate-400 hover:text-[#2563EB] transition-colors rounded"
                            title="Modifier"
                          >
                            <Pencil size={16} />
                          </button>
                          {isDirecteur && (
                            <button
                              onClick={() => setDeleteTarget({ id: client.id, nom: `${client.nom} ${client.prenom ?? ''}` })}
                              className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 0 && (
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

      {/* ── Modal suppression ── */}
      {deleteTarget && (
        <DeleteModal
          nom={deleteTarget.nom}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteMutation.isPending}
        />
      )}
    </PageLayout>
  )
}