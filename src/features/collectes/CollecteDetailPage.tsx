import { useNavigate, useParams } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { useCollecte } from './hooks/usecollectes'
import type { CollecteItemResponse } from '../../types'
import {
  ArrowLeft, ClipboardList, User, Calendar,
  Scale, Banknote, Info,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

// ─── Info Card ────────────────────────────────────────────────────────────────

function InfoCard({
  icon, title, rows,
}: {
  icon: React.ReactNode
  title: string
  rows: { label: string; value: React.ReactNode }[]
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 bg-blue-50 rounded-lg flex items-center justify-center text-[#2563EB]">
          {icon}
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="space-y-2.5">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-slate-500">{label} :</span>
            <span className="font-medium text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-40">
            <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
            <div className="space-y-3">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 h-48" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CollecteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: col, isLoading } = useCollecte(id ?? '')

  // ── Calculs ──────────────────────────────────────────────────────────────────

  const items: CollecteItemResponse[] = col?.items ?? []

  const hasItems = items.length > 0

  const totalKg = hasItems
    ? items.reduce((s, i) => s + i.quantiteKg, 0)
    : col?.quantiteKg ?? 0

  const totalMontant = hasItems
    ? items.reduce((s, i) => s + i.quantiteKg * i.prixUnitaire, 0)
    : col?.montantTotal ?? 0

  const date = col ? new Date(col.createdAt) : null
  const mois = date?.toLocaleDateString('fr-FR', { month: 'long' }) ?? '—'
  const semaine = date ? `Semaine ${getWeekNumber(date)}` : '—'
  const exercice = date?.getFullYear().toString() ?? '—'

  // Extraire les valeurs de façon défensive (le backend peut retourner des objets imbriqués)
  const apporteurNom = typeof col?.apporteur?.nom === 'string' ? col.apporteur.nom : '—'
  const apporteurTel = typeof col?.apporteur?.telephone === 'string' ? col.apporteur.telephone : '—'

  const reference = col?.reference && typeof col.reference === 'string'
    ? col.reference
    : col ? `COL-${col.id.slice(0, 8).toUpperCase()}` : '—'

  const collecteurNom = col?.collecteur
    ? [col.collecteur.prenom, col.collecteur.nom]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .join(' ') || '—'
    : '—'

  const notesText = typeof col?.notes === 'string' ? col.notes : null

  return (
    <PageLayout title="Détail de la Collecte">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/collectes')}
          className="flex items-center gap-1.5 text-sm font-medium text-[#2563EB] hover:underline transition-colors"
        >
          <ArrowLeft size={14} /> Retour à la liste
        </button>
        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full border border-green-200">
          Statut : Validée
        </span>
      </div>

      {isLoading || !col ? (
        <Skeleton />
      ) : (
        /* pb-32 pour laisser la place au footer sticky */
        <div className="space-y-6 pb-32">

          {/* ── 3 Info Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoCard
              icon={<ClipboardList size={18} />}
              title="Information Collecte"
              rows={[
                { label: 'ID', value: reference },
                { label: 'Date', value: fmtDate(col.createdAt) },
                { label: 'Collecteur', value: collecteurNom },
              ]}
            />
            <InfoCard
              icon={<User size={18} />}
              title="Apporteur"
              rows={[
                {
                  label: 'Nom',
                  value: <span className="font-bold text-slate-900">{apporteurNom}</span>,
                },
                { label: 'Téléphone', value: apporteurTel },
              ]}
            />
            <InfoCard
              icon={<Calendar size={18} />}
              title="Période"
              rows={[
                { label: 'Mois', value: mois.charAt(0).toUpperCase() + mois.slice(1) },
                { label: 'Semaine', value: semaine },
                { label: 'Exercice Fiscal', value: exercice },
              ]}
            />
          </div>

          {/* ── Tableau plastiques ── */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Plastiques Collectés</h3>
              {hasItems && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full uppercase">
                  {items.length} ligne{items.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {hasItems ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Type de plastique</th>
                      <th className="px-6 py-4 text-center">Poids (kg)</th>
                      <th className="px-6 py-4 text-center">Prix unitaire (FCFA/kg)</th>
                      <th className="px-6 py-4 text-right">Sous-total (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {item.typePlastique}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600">
                          {item.quantiteKg} kg
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600">
                          {new Intl.NumberFormat('fr-FR').format(item.prixUnitaire)} FCFA/kg
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-semibold text-[#2563EB]">
                          {fmt(item.quantiteKg * item.prixUnitaire)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Fallback : collecte simple sans items */
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Type de plastique</th>
                      <th className="px-6 py-4 text-center">Poids (kg)</th>
                      <th className="px-6 py-4 text-center">Prix unitaire (FCFA/kg)</th>
                      <th className="px-6 py-4 text-right">Sous-total (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {typeof col.typePlastique === 'string' ? col.typePlastique : 'Plastique (non spécifié)'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-600">
                        {typeof col.quantiteKg === 'number' ? col.quantiteKg : 0} kg
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-600">
                        {typeof col.prixUnitaire === 'number'
                          ? `${new Intl.NumberFormat('fr-FR').format(col.prixUnitaire)} FCFA/kg`
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-semibold text-[#2563EB]">
                        {typeof col.montantTotal === 'number' ? fmt(col.montantTotal) : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Notes ── */}
          {notesText && (
            <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-[#2563EB] shadow-sm p-6">
              <div className="flex items-center gap-2 mb-3">
                <Info size={18} className="text-[#2563EB]" />
                <h3 className="font-semibold text-slate-900">Notes & Observations</h3>
              </div>
              <p className="text-slate-500 italic text-sm">"{notesText}"</p>
            </div>
          )}

        </div>
      )}

      {/* ── Footer sticky ── */}
      {!isLoading && col && (
        <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-slate-200 px-8 py-5 flex items-center justify-between shadow-[0_-4px_10px_rgba(0,0,0,0.04)] z-20">

          {/* Totaux */}
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Poids Total
              </p>
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-slate-400" />
                <span className="text-xl font-bold text-slate-900">{totalKg} kg</span>
              </div>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                Montant à régler
              </p>
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-[#2563EB]" />
                <span className="text-xl font-bold text-[#2563EB]">{fmt(totalMontant)}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </PageLayout>
  )
}
