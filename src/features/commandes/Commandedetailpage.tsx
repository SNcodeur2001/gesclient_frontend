import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCommande } from './hooks/useCommandes'
import { PageLayout } from '../../components/layout/PageLayout'
import { Badge } from '../../components/ui/Badge'
import { useAuthStore } from '../../store/authStore'
import { useToastStore } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/apiError'
import { fetchFactureByCommandeId, downloadFacturePDF } from '../factures/api/factures.api'
import type { FactureResponse } from '../../types'
import {
  ArrowLeft, FileText, RefreshCw, Plus,
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-6xl">
      <div className="h-20 bg-slate-100 rounded-xl" />
      <div className="grid grid-cols-2 gap-6">
        <div className="h-56 bg-slate-100 rounded-xl" />
        <div className="h-56 bg-slate-100 rounded-xl" />
      </div>
      <div className="h-40 bg-slate-100 rounded-xl" />
      <div className="h-40 bg-slate-100 rounded-xl" />
    </div>
  )
}

// ─── Modal Paiement ───────────────────────────────────────────────────────────

function PaiementModal({
  commandeId,
  commandeType,
  commandeStatut,
  soldeRestant,
  acompteMinimum,
  acompteVerse,
  onClose,
}: {
  commandeId: string
  commandeType: string
  commandeStatut: string
  soldeRestant: number
  acompteMinimum: number | null
  acompteVerse: number
  onClose: () => void
}) {
  const [form, setForm] = useState({ type: 'ACOMPTE', montant: '', modePaiement: 'VIREMENT' })
  const [loading, setLoading] = useState(false)
  const isSurPlace = commandeType === 'SUR_PLACE'
  const isDistance = commandeType === 'A_DISTANCE'
  const isStatutPrete = commandeStatut === 'PRETE'
  const isSecondPaiementDistance = isDistance && acompteVerse > 0 && soldeRestant > 0
  const blockSecondPaiement = isSecondPaiementDistance && !isStatutPrete
  const addToast = useToastStore((s) => s.addToast)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return
    if (isSurPlace || (isSecondPaiementDistance && isStatutPrete)) {
      setForm((f) => ({
        ...f,
        type: 'SOLDE',
        montant: String(soldeRestant),
      }))
      setInitialized(true)
      return
    }
    if (commandeType === 'A_DISTANCE' && acompteVerse === 0 && acompteMinimum) {
      setForm((f) => ({
        ...f,
        type: 'ACOMPTE',
        montant: String(Math.round(acompteMinimum)),
      }))
    }
    setInitialized(true)
  }, [
    initialized,
    isSurPlace,
    soldeRestant,
    commandeType,
    acompteMinimum,
    acompteVerse,
    isSecondPaiementDistance,
    isStatutPrete,
  ])

  const handleSubmit = async () => {
    if (blockSecondPaiement) {
      addToast('La commande doit être au statut "Prête" pour solder.', 'error')
      return
    }
    setLoading(true)
    try {
      // POST /commandes/:id/paiements
      const api = (await import('../../lib/axios')).default
      await api.post(`/commandes/${commandeId}/paiements`, {
        type: form.type,
        montant: Number(form.montant),
        modePaiement: form.modePaiement,
      }, {
        silent: true,
      })
      if (form.type === 'ACOMPTE') {
        addToast('Acompte enregistré.', 'success')
      } else {
        addToast('Solde enregistré. Commande finalisée.', 'success')
      }
      onClose()
      window.location.reload()
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Paiement refusé.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Enregistrer un paiement</h3>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Type</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            disabled={isSurPlace || isSecondPaiementDistance}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="ACOMPTE">Acompte</option>
            <option value="SOLDE">Solde</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Montant (FCFA)</label>
          <input
            type="number"
            value={form.montant}
            onChange={e => setForm(f => ({ ...f, montant: e.target.value }))}
            placeholder="Ex: 225000"
            disabled={isSurPlace || isSecondPaiementDistance}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        {blockSecondPaiement && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Passez la commande au statut <span className="font-bold">Prête</span> pour pouvoir solder.
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Mode de paiement</label>
          <select
            value={form.modePaiement}
            onChange={e => setForm(f => ({ ...f, modePaiement: e.target.value }))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="ESPECES">Espèces</option>
            <option value="VIREMENT">Virement</option>
            <option value="CHEQUE">Chèque</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !form.montant || blockSecondPaiement}
            className="px-5 py-2 text-sm font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Enregistrement...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Statut ─────────────────────────────────────────────────────────────

function StatutModal({ commandeId, current, soldeRestant, onClose }: {
  commandeId: string; current: string; soldeRestant: number; onClose: () => void
}) {
  const [statut, setStatut] = useState(current)
  const [loading, setLoading] = useState(false)
  const paiementComplet = soldeRestant === 0
  const addToast = useToastStore((s) => s.addToast)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const api = (await import('../../lib/axios')).default
      await api.patch(`/commandes/${commandeId}/statut`, { statut }, { silent: true })
      addToast('Statut mis à jour.', 'success')
      onClose()
      window.location.reload()
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Impossible de changer le statut.'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h3 className="text-lg font-bold text-slate-800">Changer le statut</h3>
        <select
          value={statut}
          onChange={e => setStatut(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB]"
        >
          <option value="EN_ATTENTE_ACOMPTE">En attente acompte</option>
          <option value="EN_PREPARATION">En préparation</option>
          {!paiementComplet && <option value="PRETE">Prête</option>}
          <option value="FINALISEE">{paiementComplet ? 'Soldée' : 'Finalisée'}</option>
        </select>
        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || statut === current}
            className="px-5 py-2 text-sm font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Mise à jour...' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
      {children}
    </p>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const addToast = useToastStore((s) => s.addToast)
  const canMutate = user?.role !== 'DIRECTEUR'
  const [showPaiement, setShowPaiement] = useState(false)
  const [showStatut, setShowStatut] = useState(false)
  const [facture, setFacture] = useState<FactureResponse | null>(null)
  const [factureChecked, setFactureChecked] = useState(false)

  const { data: cmd, isLoading } = useCommande(id ?? '')

  useEffect(() => {
    if (!cmd?.id) return
    let isMounted = true
    setFactureChecked(false)
    setFacture(null)
    fetchFactureByCommandeId(cmd.id)
      .then((res) => {
        if (isMounted) setFacture(res)
      })
      .catch(() => {
        if (isMounted) setFacture(null)
      })
      .finally(() => {
        if (isMounted) setFactureChecked(true)
      })
    return () => {
      isMounted = false
    }
  }, [cmd?.id])

  if (isLoading) return <PageLayout title="Détail Commande"><Skeleton /></PageLayout>
  if (!cmd) return (
    <PageLayout title="Détail Commande">
      <div className="text-center py-20 text-slate-400">Commande introuvable</div>
    </PageLayout>
  )

  const totalVerse = cmd.paiements?.reduce((s, p) => s + p.montant, 0) ?? cmd.acompteVerse ?? 0
  const progression = cmd.montantTTC > 0 ? Math.round((totalVerse / cmd.montantTTC) * 100) : 0
  const totalItems = cmd.items?.length ?? (cmd.quantite ? 1 : 0)
  const totalKg = cmd.items?.reduce((s, i) => s + i.quantite, 0) ?? cmd.quantite ?? 0
  const isSurPlace = cmd.type === 'SUR_PLACE'
  const paiementComplet = cmd.soldeRestant === 0

  const handleOpenFacture = async () => {
    try {
      const resolved = facture ?? await fetchFactureByCommandeId(cmd.id)
      navigate(`/factures/${resolved.id}`)
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Aucune facture disponible pour cette commande'), 'error')
    }
  }

  const handleDownloadFacture = async () => {
    try {
      const resolved = facture ?? await fetchFactureByCommandeId(cmd.id)
      const blob = await downloadFacturePDF(resolved.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resolved.numero}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Impossible de télécharger la facture'), 'error')
    }
  }

  return (
    <PageLayout title="Détail Commande">
      <div className="space-y-6 max-w-6xl">

        {/* ── Titre + actions ── */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => navigate('/commandes')}
                className="size-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-white transition-colors"
              >
                <ArrowLeft size={16} className="text-slate-600" />
              </button>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {cmd.reference}
              </h1>
              <div className="flex gap-2">
                <Badge variant={cmd.statut} />
                <Badge variant={cmd.type} />
                {paiementComplet && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                    Paiement complet
                  </span>
                )}
              </div>
            </div>
            <p className="text-slate-500 text-sm ml-11">
              Créée le {fmtDate(cmd.createdAt)} •{' '}
              {totalItems} produit{totalItems > 1 ? 's' : ''}{totalKg > 0 ? ` (${totalKg} kg)` : ''}
            </p>
          </div>

          {/* Boutons actions */}
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {canMutate && factureChecked && facture && (
              <button
                onClick={handleOpenFacture}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <FileText size={15} /> Facture
              </button>
            )}
            {canMutate && factureChecked && facture && (
              <button
                onClick={handleDownloadFacture}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <FileText size={15} /> Télécharger PDF
              </button>
            )}
            {canMutate && !isSurPlace && (
              <button
                onClick={() => setShowStatut(true)}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <RefreshCw size={15} /> Statut
              </button>
            )}
            {canMutate && (
              <button
                onClick={() => setShowPaiement(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={15} /> Paiement
              </button>
            )}
          </div>
        </div>

        {/* ── 2 colonnes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Infos client */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Informations Client
            </h3>
            <div>
              <SectionLabel>Client</SectionLabel>
              <p className="font-bold text-lg text-slate-900">{cmd.acheteur?.nom ?? '—'}</p>
            </div>
            <div>
              <SectionLabel>Coordonnées</SectionLabel>
              <p className="text-slate-700 font-medium text-sm">
                {[cmd.acheteur?.telephone, '']
                  .filter(Boolean).join(' / ') || '—'}
              </p>
            </div>
            <div>
              <SectionLabel>Commercial</SectionLabel>
              <p className="text-slate-700 font-medium text-sm">
                {cmd.commercial
                  ? `${cmd.commercial.prenom} ${cmd.commercial.nom}`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Récap financier */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">
              Récapitulatif Financier
            </h3>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">Montant HT :</span>
              <span className="font-bold text-slate-900">{fmt(cmd.montantHT)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">TVA ({cmd.tva}%) :</span>
              <span className="font-bold text-slate-900">
                {fmt(Math.round(cmd.montantHT * cmd.tva / 100))}
              </span>
            </div>

            <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-200">
              <span className="font-extrabold text-slate-900">Montant TTC :</span>
              <span className="text-2xl font-black text-[#2563EB] leading-none">
                {fmt(cmd.montantTTC)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Acompte requis</p>
                <p className="text-sm font-bold text-slate-700">
                  {cmd.acompteMinimum != null ? fmt(cmd.acompteMinimum) : '—'}
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Total versé</p>
                <p className="text-sm font-bold text-slate-700">{fmt(totalVerse)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-bold text-slate-500">Solde restant :</span>
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                cmd.soldeRestant <= 0
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-amber-600 bg-amber-50'
              }`}>
                {fmt(cmd.soldeRestant)}
              </span>
            </div>

            {/* Progression */}
            <div className="pt-2 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-slate-500 uppercase">Progression du paiement</span>
                <span className="text-[#2563EB]">{progression}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2563EB] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progression, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Produits commandés ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Produits Commandés
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  {['Désignation du Produit', 'Quantité (kg)', 'Prix Unitaire (FCFA/kg)', 'Sous-total'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i >= 2 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cmd.items && cmd.items.length > 0
                  ? cmd.items.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 font-semibold text-slate-700">{item.produit ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-600">{item.quantite} kg</td>
                      <td className="px-6 py-4 text-right text-slate-600">{item.prixUnitaire} FCFA/kg</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">
                        {fmt(item.quantite * item.prixUnitaire)}
                      </td>
                    </tr>
                  ))
                  : cmd.produit
                  ? (
                    <tr>
                      <td className="px-6 py-4 font-semibold text-slate-700">{cmd.produit}</td>
                      <td className="px-6 py-4 text-slate-600">{cmd.quantite ?? '—'} kg</td>
                      <td className="px-6 py-4 text-right text-slate-600">{cmd.prixUnitaire ?? '—'} FCFA/kg</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{fmt(cmd.montantHT)}</td>
                    </tr>
                  )
                  : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                        Aucun produit
                      </td>
                    </tr>
                  )
                }
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50/30 flex justify-end">
            <p className="text-sm font-bold text-[#2563EB]">
              Total Articles — {fmt(cmd.montantHT)} HT
            </p>
          </div>
        </div>

        {/* ── Historique paiements ── */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Historique des Règlements
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50">
                <tr>
                  {['Date de paiement', 'Type', 'Mode de paiement', 'Montant versé'].map((h, i) => (
                    <th key={h} className={`px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider ${i === 3 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!cmd.paiements || cmd.paiements.length === 0
                  ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                        Aucun paiement enregistré
                      </td>
                    </tr>
                  )
                  : cmd.paiements.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 text-slate-600">{fmtDate(p.createdAt)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.type} />
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{p.modePaiement}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{fmt(p.montant)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ── Modals ── */}
      {showPaiement && canMutate && (
        <PaiementModal
          commandeId={id ?? ''}
          commandeType={cmd.type}
          commandeStatut={cmd.statut}
          soldeRestant={cmd.soldeRestant}
          acompteMinimum={cmd.acompteMinimum}
          acompteVerse={cmd.acompteVerse}
          onClose={() => setShowPaiement(false)}
        />
      )}
      {showStatut && canMutate && (
        <StatutModal
          commandeId={id ?? ''}
          current={cmd.statut}
          soldeRestant={cmd.soldeRestant}
          onClose={() => setShowStatut(false)}
        />
      )}
    </PageLayout>
  )
}
