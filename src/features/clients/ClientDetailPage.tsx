import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/ui/Badge'
import { useClient } from './hooks/useClients'
import api from '../../lib/axios'
import type { CommandeResponseDto } from '../../types'
import {
  ArrowLeft, Pencil, Mail, Phone, MapPin,
  BarChart2, ShoppingBag, Recycle, Calendar,
  Eye, ChevronLeft, ChevronRight, FileText, User,
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

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Hook commandes du client ─────────────────────────────────────────────────

function useClientCommandes(clientId: string, page: number) {
  return useQuery({
    queryKey: ['commandes', 'client', clientId, page],
    queryFn: async () => {
      const { data } = await api.get('/commandes', {
        params: { clientId, page, limit: 5 },
      })
      const raw = data?.data
      return {
        items: (raw?.items ?? raw?.data ?? []) as CommandeResponseDto[],
        total: raw?.total ?? 0,
        totalPages: raw?.totalPages ?? 1,
      }
    },
    enabled: !!clientId,
    staleTime: 1000 * 60 * 2,
  })
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-xl border border-slate-200 p-6 h-28" />
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 h-64" />
        <div className="bg-white rounded-xl border border-slate-200 h-64" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 h-80" />
    </div>
  )
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({
  icon, label, children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="size-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
        {icon}
      </div>
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
          {label}
        </span>
        <div className="text-sm font-medium text-slate-700">{children}</div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [cmdPage, setCmdPage] = useState(1)

  const { data: client, isLoading } = useClient(id ?? '')
  const { data: cmdData, isLoading: cmdLoading } = useClientCommandes(id ?? '', cmdPage)

  if (isLoading) {
    return (
      <PageLayout title="Détail Client">
        <SkeletonDetail />
      </PageLayout>
    )
  }

  if (!client) {
    return (
      <PageLayout title="Détail Client">
        <div className="text-center py-20 text-slate-400">Client introuvable</div>
      </PageLayout>
    )
  }

  const nomComplet = `${client.nom}${client.prenom ? ' ' + client.prenom : ''}`
  const shortId = client.id.slice(0, 6).toUpperCase()

  return (
    <PageLayout title="Détail Client">
      <div className="space-y-6">

        {/* ── Header card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Avatar + infos */}
            <div className="flex items-center gap-4">
              <div className="size-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                <User size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900">{nomComplet}</h1>
                  <Badge variant={client.type} />
                  <Badge variant={client.statut} />
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {shortId} • Gestionnaire :{' '}
                  <span className="font-medium text-slate-600">Admin Proplast</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate('/clients')}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft size={16} />
                Retour à la liste
              </button>
              <button
                onClick={() => navigate(`/clients/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Pencil size={15} />
                Modifier le profil
              </button>
            </div>
          </div>
        </div>

        {/* ── 2 colonnes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Coordonnées */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText size={18} className="text-[#2563EB]" />
              <h3 className="font-semibold text-slate-800">Coordonnées</h3>
            </div>
            <div className="p-6 space-y-6">
              <InfoRow icon={<Mail size={16} />} label="E-mail">
                {client.email
                  ? <a href={`mailto:${client.email}`} className="hover:text-[#2563EB] underline decoration-slate-200 transition-colors">{client.email}</a>
                  : <span className="text-slate-400">—</span>
                }
              </InfoRow>
              <InfoRow icon={<Phone size={16} />} label="Téléphone">
                {client.telephone ?? <span className="text-slate-400">—</span>}
              </InfoRow>
              <InfoRow icon={<MapPin size={16} />} label="Adresse">
                {client.adresse ?? <span className="text-slate-400">—</span>}
              </InfoRow>

              {client.notes && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Notes internes
                  </span>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                    <p className="text-sm text-slate-600 italic leading-relaxed">
                      "{client.notes}"
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Performance Commerciale */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
              <BarChart2 size={18} className="text-[#2563EB]" />
              <h3 className="font-semibold text-slate-800">Performance Commerciale</h3>
            </div>
            <div className="p-6 space-y-7">
              {/* Revenu total */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Revenu total généré
                </span>
                <p className="text-3xl font-extrabold text-[#2563EB]">
                  {formatFCFA(client.totalRevenue ?? 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1 italic">
                  Cumulé depuis le début du partenariat
                </p>
              </div>

              {/* Stats mini */}
              <div className="grid grid-cols-2 gap-5">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <ShoppingBag size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Commandes</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">
                    {cmdData?.total ?? '—'}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Recycle size={13} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Collectes</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-800">—</p>
                </div>
              </div>

              {/* Date adhésion */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Date d'adhésion
                </span>
                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar size={15} className="text-slate-400" />
                  <span className="font-semibold text-sm">
                    {formatDateLong(client.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Commandes associées ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#2563EB]" />
              <h3 className="font-semibold text-slate-800">Commandes Associées</h3>
            </div>
            <button
              onClick={() => navigate('/commandes')}
              className="flex items-center gap-1 text-sm text-[#2563EB] font-semibold hover:underline"
            >
              Voir tout l'historique
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            {cmdLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-50 rounded animate-pulse" />
                ))}
              </div>
            ) : !cmdData?.items.length ? (
              <div className="px-6 py-12 text-center text-slate-400 text-sm">
                Aucune commande associée
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    {['Référence', 'Date de commande', 'Montant TTC', 'Statut', 'Action'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${i === 4 ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cmdData.items.map((cmd) => (
                    <tr key={cmd.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900 text-sm">
                        {cmd.reference ?? cmd.id.slice(0, 12).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {formatDate(cmd.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {formatFCFA(cmd.montantTTC)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={cmd.statut} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/commandes/${cmd.id}`)}
                          className="p-1.5 text-slate-400 hover:text-[#2563EB] transition-colors"
                          title="Voir la commande"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination commandes */}
          {cmdData && cmdData.total > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Affichage de{' '}
                <span className="font-bold text-slate-700">
                  {Math.min((cmdPage - 1) * 5 + 1, cmdData.total)}–{Math.min(cmdPage * 5, cmdData.total)}
                </span>{' '}
                résultats sur{' '}
                <span className="font-bold text-slate-700">{cmdData.total}</span> au total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCmdPage(p => p - 1)}
                  disabled={cmdPage === 1}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={13} /> Précédent
                </button>
                <button
                  onClick={() => setCmdPage(p => p + 1)}
                  disabled={cmdPage >= cmdData.totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </PageLayout>
  )
}