import { useNavigate, useParams } from 'react-router-dom'
import { useFacture } from './hooks/useFacture'
import { downloadFacturePDF, sendFactureWhatsApp } from './api/factures.api'
import { PageLayout } from '../../components/layout/PageLayout'
import { useToastStore } from '../../store/toastStore'
import { getApiErrorMessage } from '../../lib/apiError'
import type { FactureResponse } from '../../types'
import {
  ArrowLeft, Download, MessageSquare, Info, Send, Link2,
} from 'lucide-react'

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

function fmtDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function TypeBadge({ type }: { type: FactureResponse['type'] }) {
  const label = type === 'DEFINITIVE' ? 'Définitive' : 'Proforma'
  const cls = type === 'DEFINITIVE'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-100 text-slate-600'
  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

function StatutBadge({ statut }: { statut: FactureResponse['statut'] }) {
  const map: Record<string, string> = {
    GENEREE: 'bg-slate-100 text-slate-600',
    ENVOYEE: 'bg-blue-100 text-blue-700',
    TELECHARGE: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <span className={`px-2.5 py-0.5 text-xs font-bold rounded uppercase tracking-wide ${map[statut] ?? map.GENEREE}`}>
      {statut}
    </span>
  )
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-14 bg-white rounded-xl border border-slate-200" />
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-9 h-[520px] bg-white rounded-xl border border-slate-200" />
        <div className="col-span-3 space-y-6">
          <div className="h-48 bg-white rounded-xl border border-slate-200" />
          <div className="h-48 bg-white rounded-xl border border-slate-200" />
          <div className="h-40 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    </div>
  )
}

type WhatsAppResponse = {
  waLink?: string
  data?: {
    waLink?: string
  }
}

export function FactureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const { data: facture, isLoading } = useFacture(id ?? '')

  const commande = facture?.commande
  const acheteur = commande?.acheteur

  const lineItems: { label: string; qty: number; price: number; total: number }[] = commande?.items?.length
    ? commande.items.map((i) => ({
      label: i.produit,
      qty: i.quantite,
      price: i.prixUnitaire,
      total: i.quantite * i.prixUnitaire,
    }))
    : (commande?.produit ? [{
      label: commande.produit,
      qty: commande.quantite ?? 0,
      price: commande.prixUnitaire ?? 0,
      total: (commande.quantite ?? 0) * (commande.prixUnitaire ?? 0),
    }] : [])

  const totalHT = facture?.montantHT ?? 0
  const tva = facture?.tva ?? 0
  const totalTTC = facture?.montantTTC ?? 0

  const linkValid = !!facture?.downloadToken
    && !!facture.downloadTokenExpiresAt
    && new Date(facture.downloadTokenExpiresAt) > new Date()

  const handleDownload = async () => {
    if (!facture) return
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
      addToast(getApiErrorMessage(err, "Impossible de télécharger le PDF"), 'error')
    }
  }

  const handleSendWhatsApp = async () => {
    if (!facture) return
    const phone = acheteur?.telephone
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

  if (isLoading || !facture) {
    return (
      <PageLayout title="Aperçu Facture">
        <Skeleton />
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Aperçu Facture">
      <div className="space-y-6">

        {/* Action Bar */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/factures')}
              className="text-[#2563EB] font-medium flex items-center gap-1 hover:underline underline-offset-4"
            >
              <ArrowLeft size={14} />
              Retour à la liste
            </button>
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold">{facture.numero}</span>
              <TypeBadge type={facture.type} />
              <StatutBadge statut={facture.statut} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSendWhatsApp}
              className="px-4 py-2 border border-slate-200 rounded-lg font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <MessageSquare size={16} />
              WhatsApp
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-[#2563EB] text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
            >
              <Download size={16} />
              Télécharger PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* PDF Preview */}
          <div className="col-span-9 flex justify-center bg-slate-200/50 p-10 rounded-xl border border-dashed border-slate-300">
            <div className="bg-white w-full max-w-[800px] aspect-[1/1.414] shadow-2xl rounded-sm p-12 text-slate-900 overflow-hidden flex flex-col">

              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="text-2xl font-black text-slate-900 mb-1 tracking-tight">PROPLAST</div>
                  <div className="text-[12px] text-slate-500 leading-relaxed uppercase font-medium">
                    Zone Industrielle de Dakar<br />
                    Sénégal, BP 12345<br />
                    contact@proplast.sn
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#2563EB] font-bold text-xl uppercase tracking-tighter mb-2">
                    Facture {facture.type === 'DEFINITIVE' ? 'Définitive' : 'Proforma'}
                  </div>
                  <div className="text-sm font-semibold">N° {facture.numero}</div>
                  <div className="text-sm text-slate-500 font-medium">Date: {fmtDate(facture.createdAt)}</div>
                </div>
              </div>

              <div className="mb-8 bg-slate-50 p-6 rounded border border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">Facturé à :</div>
                <div className="text-base font-bold text-slate-900">
                  {acheteur ? `${acheteur.prenom ?? ''} ${acheteur.nom}`.trim() : '—'}
                </div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  {acheteur?.adresse ?? '—'}<br />
                  {acheteur?.email ?? '—'} {acheteur?.telephone ? `| ${acheteur.telephone}` : ''}
                </div>
              </div>

              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 uppercase mb-3 border-b-2 border-slate-900 pb-1 inline-block">
                  Détail de la commande
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
                    <tr>
                      <th className="px-4 py-3 text-left">Désignation</th>
                      <th className="px-4 py-3 text-center">Qté</th>
                      <th className="px-4 py-3 text-right">Prix Unit. (FCFA)</th>
                      <th className="px-4 py-3 text-right">Sous-total (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                          Aucun article
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-5 font-medium">{it.label}</td>
                          <td className="px-4 py-5 text-center">{it.qty}</td>
                          <td className="px-4 py-5 text-right font-medium">{fmt(it.price)}</td>
                          <td className="px-4 py-5 text-right font-bold text-slate-900">{fmt(it.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end mt-6">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>Total HT</span>
                    <span>{fmt(totalHT)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 font-medium">
                    <span>TVA</span>
                    <span>{fmt(tva)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-y border-slate-100">
                    <span className="font-bold text-slate-900">Total TTC</span>
                    <span className="font-black text-[#2563EB] text-lg">{fmt(totalTTC)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Acompte</span>
                    <span>{fmt(commande?.acompteVerse ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Solde réglé</span>
                    <span>{fmt((commande?.acompteVerse ?? 0) - (commande?.soldeRestant ?? 0))}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="font-bold text-sm">Solde restant</span>
                    <span className="font-bold text-emerald-600">{fmt(commande?.soldeRestant ?? 0)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400">
                <p className="font-medium">Merci pour votre confiance — Proplast © 2026</p>
                <p className="mt-1">Document généré automatiquement le {fmtDate(facture.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Right Stack */}
          <div className="col-span-3 space-y-6">

            {/* Info */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Info size={16} className="text-[#2563EB]" />
                Informations
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Type</label>
                  <div className="mt-1 flex">
                    <TypeBadge type={facture.type} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Numéro</label>
                  <p className="text-sm font-medium mt-0.5">{facture.numero}</p>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Commande liée</label>
                  <p className="mt-0.5">
                    <span className="text-sm font-medium text-[#2563EB]">
                      {commande?.reference ?? facture.commandeId.slice(0, 12)}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Générée par</label>
                  <p className="text-sm font-medium mt-0.5">
                    {facture.generePar?.prenom
                      ? `${facture.generePar.prenom} ${facture.generePar.nom}`
                      : 'Système Automatique'}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Date de création</label>
                  <p className="text-sm font-medium mt-0.5">{fmtDateTime(facture.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Send size={16} className="text-emerald-600" />
                Envoi WhatsApp
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Statut</label>
                  <div className="mt-1 flex">
                    <StatutBadge statut={facture.envoyeeWhatsApp ? 'ENVOYEE' : 'GENEREE'} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Date/Heure</label>
                  <p className="text-sm font-medium mt-0.5">{fmtDateTime(facture.dateEnvoiWhatsApp)}</p>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Destinataire</label>
                  <p className="text-sm font-medium mt-0.5">{facture.telephoneEnvoye ?? '—'}</p>
                </div>
                <button
                  onClick={handleSendWhatsApp}
                  className="w-full py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors mt-2"
                >
                  <Send size={16} />
                  Renvoyer
                </button>
              </div>
            </div>

            {/* Download Link */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Link2 size={16} className="text-slate-500" />
                Lien de téléchargement
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Statut du lien</label>
                  <div className="mt-1 flex">
                    <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded ${
                      linkValid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                    >
                      {linkValid ? 'ACTIF' : 'EXPIRÉ'}
                    </span>
                  </div>
                </div>
                <button
                  disabled
                  className="w-full py-2 bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 rounded-lg text-sm font-bold flex items-center justify-center gap-2 cursor-not-allowed"
                >
                  Générer un nouveau lien
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  )
}
