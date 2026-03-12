import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/ui/Badge'
import api from '../../lib/axios'
import type { CommandeResponseDto, PaginatedResponse } from '../../types'
import { PlusCircle, UserPlus } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatFCFA(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useCommercialStats() {
  // Total clients assignés
  const clientsQuery = useQuery({
    queryKey: ['commercial', 'clients-count'],
    queryFn: async () => {
      const { data } = await api.get('/clients', { params: { page: 1, limit: 1 } })
      return (data?.data?.pagination?.total ?? data?.data?.total ?? 0) as number
    },
    staleTime: 1000 * 60 * 2,
  })

  // Commandes récentes + stats
  const commandesQuery = useQuery({
    queryKey: ['commercial', 'commandes-recent'],
    queryFn: async () => {
      const { data } = await api.get('/commandes', { params: { page: 1, limit: 5 } })
      const items: CommandeResponseDto[] = data?.data?.items ?? data?.data?.data ?? []
      const total: number = data?.data?.pagination?.total ?? data?.data?.total ?? 0

      // Paiements en attente = somme des soldes restants des commandes non finalisées
      const enAttente = items.filter(c => c.statut !== 'FINALISEE')
      const montantEnAttente = enAttente.reduce((sum, c) => sum + (c.soldeRestant ?? 0), 0)

      return { items, total, montantEnAttente, nbEnAttente: enAttente.length }
    },
    staleTime: 1000 * 60 * 2,
  })

  return { clientsQuery, commandesQuery }
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/2 mb-3" />
      <div className="h-8 bg-slate-100 rounded w-2/3" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardCommercialPage() {
  const navigate = useNavigate()
  const { clientsQuery, commandesQuery } = useCommercialStats()

  const totalClients = clientsQuery.data ?? 0
  const commandes = commandesQuery.data?.items ?? []
  const totalCommandes = commandesQuery.data?.total ?? 0
  const montantEnAttente = commandesQuery.data?.montantEnAttente ?? 0
  const nbEnAttente = commandesQuery.data?.nbEnAttente ?? 0

  const isLoading = clientsQuery.isLoading || commandesQuery.isLoading

  return (
    <PageLayout title="Tableau de bord">
      <div className="space-y-8">

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* Mes Clients */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                <span className="text-slate-500 font-medium text-sm">Mes Clients</span>
                <span className="text-3xl font-bold text-slate-900">{totalClients}</span>
              </div>

              {/* Mes Commandes */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                <span className="text-slate-500 font-medium text-sm">Mes Commandes</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{totalCommandes}</span>
                  <span className="text-xs font-medium text-slate-400">ce mois</span>
                </div>
              </div>

              {/* Paiements en attente */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
                <span className="text-slate-500 font-medium text-sm">Paiements en attente</span>
                <span className="text-3xl font-bold text-slate-900">{formatFCFA(montantEnAttente)}</span>
                {nbEnAttente > 0 && (
                  <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mt-1">
                    {nbEnAttente} commande{nbEnAttente > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Actions rapides ── */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/commandes/nouveau')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-200"
          >
            <PlusCircle size={18} />
            Nouvelle commande
          </button>
          <button
            onClick={() => navigate('/clients/nouveau')}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-all"
          >
            <UserPlus size={18} />
            Ajouter un client
          </button>
        </div>

        {/* ── Commandes récentes ── */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800">Mes commandes récentes</h3>
            <a href="/commandes" className="text-[#2563EB] font-semibold text-sm hover:underline">
              Voir tout
            </a>
          </div>
          <div className="overflow-x-auto">
            {commandesQuery.isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
                ))}
              </div>
            ) : commandes.length === 0 ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">
                Aucune commande récente
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                    <th className="px-6 py-4">Référence</th>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Montant TTC</th>
                    <th className="px-6 py-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commandes.map((cmd) => (
                    <tr
                      key={cmd.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/commandes/${cmd.id}`)}
                    >
                      <td className="px-6 py-4 font-medium text-[#2563EB]">
                        {cmd.reference}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {cmd.acheteur?.nom ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {formatDate(cmd.createdAt)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {formatFCFA(cmd.montantTTC)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={cmd.statut} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </PageLayout>
  )
}