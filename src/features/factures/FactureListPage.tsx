import { useState, useCallback, useRef } from 'react'
import { PageLayout } from '../../components/layout/PageLayout'
import { useFactures } from './hooks/useFacture'
import { downloadFacturePDF, sendFactureWhatsApp } from './api/factures.api'
import type { FactureListParams } from './api/factures.api'
import type { FactureResponse, FactureType, FactureStatut } from '../../types'
import { useNavigate } from 'react-router-dom'
import { useToastStore } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/apiError'
import {
  Search, Calendar, Download, MessageSquare,
  MoreVertical, FileText, ChevronLeft, ChevronRight,
  Send, Clock, CheckCircle,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── Badge Type ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: FactureType }) {
  if (type === 'DEFINITIVE') {
    return (
      <span className="px-2.5 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
        Définitive
      </span>
    )
  }
  return (
    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
      Proforma
    </span>
  )
}

// ─── Badge Statut ─────────────────────────────────────────────────────────────

function StatutBadge({ statut }: { statut: FactureStatut }) {
  if (statut === 'ENVOYEE') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full w-fit">
        <Send size={11} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Envoyée</span>
      </div>
    )
  }
  if (statut === 'TELECHARGE') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full w-fit">
        <CheckCircle size={11} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Téléchargé</span>
      </div>
    )
  }
  // GENEREE
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full w-fit">
      <Clock size={11} />
      <span className="text-[10px] font-bold uppercase tracking-wider">Générée</span>
    </div>
  )
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-100 rounded w-3/4" />
        </td>
      ))}
    </tr>
  )
}

type WhatsAppResponse = {
  waLink?: string
  data?: {
    waLink?: string
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function FacturesListPage() {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [params, setParams] = useState<FactureListParams>({
    page: 1, limit: 10, search: '', type: '',
  })
  const [searchVal, setSearchVal] = useState('')

  const { data, isLoading } = useFactures(params)

  const factures = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total ?? 0
  const totalPages = pagination?.totalPages ?? 1
  const currentPage = params.page ?? 1

  // KPI
  const totalDefinitif = factures
    .filter(f => f.type === 'DEFINITIVE')
    .reduce((s, f) => s + f.montantTTC, 0)
  const proformaCount = factures.filter(f => f.type === 'PROFORMA').length

  // Recherche
  const handleSearch = useCallback((val: string) => {
    setSearchVal(val)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setParams(p => ({ ...p, search: val, page: 1 }))
    }, 400)
  }, [])

  // Télécharger PDF
  const handleDownload = async (facture: FactureResponse) => {
    try {
      const blob = await downloadFacturePDF(facture.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${facture.numero}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      addToast('PDF téléchargé.', 'success')
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Impossible de télécharger le PDF'), 'error')
    }
  }

  const handleWhatsApp = async (facture: FactureResponse) => {
    const phone = facture?.commande?.acheteur?.telephone
    if (!phone || phone.trim().length === 0) {
      addToast('Numéro WhatsApp manquant pour ce client.', 'error')
      return
    }
    const pendingWindow = window.open('about:blank', '_blank')
    try {
      const res = await sendFactureWhatsApp(facture.id) as WhatsAppResponse
      const waLink = res?.waLink ?? res?.data?.waLink
      if (waLink) {
        if (pendingWindow) {
          pendingWindow.location.assign(waLink)
        } else {
          window.location.assign(waLink)
        }
        addToast('Lien WhatsApp généré', 'success')
      } else {
        if (pendingWindow) pendingWindow.close()
        addToast('Lien WhatsApp indisponible', 'error')
      }
    } catch (err) {
      if (pendingWindow) pendingWindow.close()
      addToast(getApiErrorMessage(err, "Échec de l'envoi WhatsApp"), 'error')
    }
  }

  // Pagination numéros
  const pageNumbers = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i)
      }
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  const from = (currentPage - 1) * (params.limit ?? 10) + 1
  const to = Math.min(currentPage * (params.limit ?? 10), total)

  return (
    <PageLayout title="Liste des Factures">
      <div className="space-y-6">

        {/* ── 3 KPI Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Total Définitives (Mois)</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              {isLoading ? '...' : fmt(totalDefinitif)}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Factures Proforma Actives</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">
              {isLoading ? '...' : `${proformaCount} document${proformaCount > 1 ? 's' : ''}`}
            </h3>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Dernière mise à jour</p>
            <h3 className="text-2xl font-bold text-[#2563EB] mt-2">
              Aujourd'hui, {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Synchronisation Automatique
            </p>
          </div>
        </div>

        {/* ── Filtres ── */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
          {/* Recherche */}
          <div className="flex-1 min-w-[280px] relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchVal}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher par numéro de facture ou client..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
            />
          </div>

          {/* Type */}
          <select
            value={params.type ?? ''}
            onChange={e => setParams(p => ({ ...p, type: e.target.value as FactureType | '', page: 1 }))}
            className="bg-slate-50 border border-slate-200 rounded-lg text-sm py-2 px-4 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
          >
            <option value="">Tous les types</option>
            <option value="DEFINITIVE">Définitive</option>
            <option value="PROFORMA">Proforma</option>
          </select>

          {/* Période */}
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              readOnly
              value={`Période (${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })})`}
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-52 cursor-default text-slate-600"
            />
          </div>

        </div>

        {/* ── Tableau ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {['Numéro', 'Type', 'Commande', 'Client', 'Montant TTC', 'Statut', 'Date', 'Actions'].map((h, i) => (
                    <th key={h} className={`px-6 py-4 ${i === 7 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  : !factures.length
                  ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-14 text-center text-slate-400 text-sm">
                        Aucune facture trouvée
                      </td>
                    </tr>
                  )
                  : factures.map((f: FactureResponse) => (
                    <tr
                      key={f.id}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/factures/${f.id}`)}
                    >

                      {/* Numéro */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-slate-400 shrink-0" />
                          <span className="text-sm font-semibold text-slate-700">{f.numero}</span>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <TypeBadge type={f.type} />
                      </td>

                      {/* Commande */}
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {f.commande?.reference ?? f.commandeId.slice(0, 12)}
                      </td>

                      {/* Client */}
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {f.commande?.acheteur?.nom ?? '—'}
                      </td>

                      {/* Montant TTC */}
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {fmt(f.montantTTC)}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4">
                        <StatutBadge statut={f.statut} />
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {fmtDate(f.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 text-slate-400">
                          <button
                            onClick={() => navigate(`/factures/${f.id}`)}
                            title="Voir"
                            className="p-1.5 hover:text-[#2563EB] transition-colors rounded"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(f)}
                            title="Télécharger PDF"
                            className="p-1.5 hover:text-[#2563EB] transition-colors rounded"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleWhatsApp(f)}
                            title="Envoyer WhatsApp"
                            className="p-1.5 hover:text-green-500 transition-colors rounded"
                          >
                            <MessageSquare size={16} />
                          </button>
                          <button
                            title="Plus"
                            className="p-1.5 hover:text-slate-700 transition-colors rounded"
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

          {/* ── Pagination ── */}
          <div className="px-6 py-4 flex items-center justify-between border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {total > 0
                ? <>Affichage de <span className="font-semibold text-slate-700">{from} à {to}</span> sur <span className="font-semibold text-slate-700">{total}</span> factures</>
                : 'Aucune facture'
              }
            </p>

            <div className="flex items-center gap-1">
              {/* Précédent */}
              <button
                onClick={() => setParams(p => ({ ...p, page: currentPage - 1 }))}
                disabled={currentPage <= 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Numéros */}
              {pageNumbers().map((p, i) =>
                p === '...'
                  ? <span key={`dots-${i}`} className="px-2 text-slate-400 text-sm">...</span>
                  : (
                    <button
                      key={p}
                      onClick={() => setParams(prev => ({ ...prev, page: p as number }))}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        p === currentPage
                          ? 'bg-[#2563EB] text-white font-bold'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  )
              )}

              {/* Suivant */}
              <button
                onClick={() => setParams(p => ({ ...p, page: currentPage + 1 }))}
                disabled={currentPage >= totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

          </div>
        </div>

      </div>
    </PageLayout>
  )
}
