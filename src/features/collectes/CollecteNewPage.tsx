import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { useCreateCollecte } from './hooks/usecollectes'
import { useClients } from '../clients/hooks/useClients'
import type { ClientResponseDto } from '../../types'
import { useAuthStore } from '../../store/authStore'
import {
  Search, UserPlus, Plus, Trash2,
  Save, X, RefreshCw, User,
  FileText, ClipboardList, TriangleAlert,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

const TYPES_PLASTIQUE = [
  'PP (Polypropylène)',
  'PET (Polyéthylène Téréphtalate)',
  'PEHD (Polyéthylène Haute Densité)',
  'PVC (Polychlorure de Vinyle)',
  'PEBD (Polyéthylène Basse Densité)',
  'PS (Polystyrène)',
  'Autres',
]

interface ItemRow {
  id: number
  typePlastique: string
  quantiteKg: number | ''
  prixUnitaire: number | ''
}

let nextId = 1
function newRow(): ItemRow {
  return {
    id: nextId++,
    typePlastique: TYPES_PLASTIQUE[0],
    quantiteKg: '',
    prixUnitaire: 200,
  }
}

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CollecteNewPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isDirecteur = user?.role === 'DIRECTEUR'
  const createMutation = useCreateCollecte()
  const searchRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  if (isDirecteur) {
    return (
      <PageLayout title="Nouvelle Collecte">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
          Cette action n&apos;est pas disponible pour le rôle Directeur.
        </div>
      </PageLayout>
    )
  }

  // Apporteur
  const [clientSearch, setClientSearch] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedApporteur, setSelectedApporteur] = useState<ClientResponseDto | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Items
  const [items, setItems] = useState<ItemRow[]>([newRow()])

  // Notes
  const [notes, setNotes] = useState('')

  // Recherche apporteurs (type APPORTEUR)
  const { data: clientsData } = useClients({
    page: 1, limit: 10,
    search: searchQuery,
    type: 'APPORTEUR',
  })

  const handleSearch = useCallback((val: string) => {
    setClientSearch(val)
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      setSearchQuery(val)
      setShowDropdown(true)
    }, 400)
  }, [])

  // Gestion items
  const addItem = () => setItems(prev => [...prev, newRow()])

  const removeItem = (id: number) =>
    setItems(prev => prev.filter(r => r.id !== id))

  const updateItem = (id: number, field: keyof ItemRow, value: string) =>
    setItems(prev => prev.map(r => {
      if (r.id !== id) return r
      if (field === 'typePlastique') return { ...r, typePlastique: value }
      return { ...r, [field]: value === '' ? '' : Number(value) }
    }))

  // Calculs
  const totalKg = items.reduce((s, r) => s + (Number(r.quantiteKg) || 0), 0)
  const totalMontant = items.reduce(
    (s, r) => s + (Number(r.quantiteKg) || 0) * (Number(r.prixUnitaire) || 0),
    0
  )

  // Soumission
  const handleSubmit = async () => {
    if (!selectedApporteur) return

    const validItems = items.filter(
      r => r.typePlastique && Number(r.quantiteKg) > 0 && Number(r.prixUnitaire) > 0
    )
    if (validItems.length === 0) return

    await createMutation.mutateAsync({
      apporteurId: selectedApporteur.id,
      items: validItems.map(r => ({
        typePlastique: r.typePlastique,
        quantiteKg: Number(r.quantiteKg),
        prixUnitaire: Number(r.prixUnitaire),
      })),
      notes: notes.trim() || undefined,
    })
    navigate('/collectes')
  }

  const canSubmit = !!selectedApporteur && items.some(
    r => Number(r.quantiteKg) > 0 && Number(r.prixUnitaire) > 0
  )

  return (
    <PageLayout title="Nouvelle Collecte">
      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Enregistrer une collecte</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Saisissez les informations de réception des matières plastiques.
        </p>
      </div>

      <div className="flex gap-8 items-start">

        {/* ── Colonne gauche (2/3) ── */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Section 1 — Apporteur */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-visible shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <User size={16} className="text-[#2563EB]" />
              <h3 className="font-semibold text-slate-800">Informations Apporteur</h3>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sélectionner un apporteur
              </label>

              {/* Apporteur sélectionné */}
              {selectedApporteur ? (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selectedApporteur.nom}</p>
                    <p className="text-xs text-slate-500">{selectedApporteur.telephone ?? selectedApporteur.email ?? ''}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedApporteur(null); setClientSearch('') }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Changer
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={e => handleSearch(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Rechercher par nom ou téléphone..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
                      />
                    </div>
                    <button
                      onClick={() => navigate('/clients/nouveau')}
                      className="flex items-center gap-2 px-4 py-2.5 border border-[#2563EB] text-[#2563EB] font-medium rounded-lg hover:bg-blue-50 text-sm transition-colors"
                    >
                      <UserPlus size={14} /> Nouvel apporteur
                    </button>
                  </div>

                  {/* Dropdown */}
                  {showDropdown && clientsData && clientsData.items.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl z-20 max-h-56 overflow-y-auto">
                      {clientsData.items.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedApporteur(c)
                            setClientSearch(c.nom)
                            setShowDropdown(false)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                        >
                          <p className="font-medium text-slate-800 text-sm">{c.nom}</p>
                          <p className="text-xs text-slate-400">{c.telephone ?? c.email ?? ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2 — Types de plastique */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw size={16} className="text-[#2563EB]" />
                <h3 className="font-semibold text-slate-800">Types de plastique collectés</h3>
              </div>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#2563EB] text-[#2563EB] font-medium rounded-lg hover:bg-blue-50 text-xs transition-colors"
              >
                <Plus size={14} /> Ajouter un type
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">Type de Plastique</th>
                    <th className="px-6 py-3">Quantité (KG)</th>
                    <th className="px-6 py-3">P.U (FCFA/KG)</th>
                    <th className="px-6 py-3">Sous-total</th>
                    <th className="px-6 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map(row => {
                    const sousTotal = (Number(row.quantiteKg) || 0) * (Number(row.prixUnitaire) || 0)
                    return (
                      <tr key={row.id}>
                        {/* Type */}
                        <td className="px-6 py-4">
                          <select
                            value={row.typePlastique}
                            onChange={e => updateItem(row.id, 'typePlastique', e.target.value)}
                            className="w-full border border-slate-200 bg-white rounded-lg text-sm px-2 py-2 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
                          >
                            {TYPES_PLASTIQUE.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </td>
                        {/* Quantité */}
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={row.quantiteKg}
                            onChange={e => updateItem(row.id, 'quantiteKg', e.target.value)}
                            placeholder="0"
                            min={0}
                            className="w-24 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
                          />
                        </td>
                        {/* Prix unitaire */}
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={row.prixUnitaire}
                            onChange={e => updateItem(row.id, 'prixUnitaire', e.target.value)}
                            placeholder="0"
                            min={0}
                            className="w-24 border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
                          />
                        </td>
                        {/* Sous-total */}
                        <td className="px-6 py-4">
                          <span className="text-[#2563EB] font-bold text-sm">
                            {fmt(sousTotal)}
                          </span>
                        </td>
                        {/* Supprimer */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => removeItem(row.id)}
                            disabled={items.length === 1}
                            className="text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3 — Notes */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <FileText size={16} className="text-[#2563EB]" />
              <h3 className="font-semibold text-slate-800">Notes & Observations</h3>
            </div>
            <div className="p-6">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={4}
                placeholder="Précisez ici toute information pertinente sur la collecte (qualité, logistique...)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-4 py-3 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] placeholder:text-slate-400 transition resize-none"
              />
            </div>
          </div>

        </div>

        {/* ── Colonne droite sticky (1/3) ── */}
        <div className="w-80 shrink-0 sticky top-24 space-y-4">

          {/* Récapitulatif */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardList size={16} className="text-slate-400" />
              Récapitulatif
            </h3>

            <ul className="space-y-3 mb-5">
              <li className="flex justify-between text-sm text-slate-600">
                <span>Nombre de types :</span>
                <span className="font-medium text-slate-900">{items.length}</span>
              </li>
              <li className="flex justify-between text-sm text-slate-600">
                <span>Poids total cumulé :</span>
                <span className="font-medium text-slate-900">{totalKg} kg</span>
              </li>
            </ul>

            <div className="border-t border-dashed border-slate-200 pt-4 mb-6">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Montant total à payer
              </p>
              <p className="text-3xl font-extrabold text-[#2563EB]">{fmt(totalMontant)}</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit || createMutation.isPending}
              className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer la collecte'}
            </button>

            <button
              onClick={() => navigate('/collectes')}
              className="w-full mt-3 text-center text-slate-500 hover:text-slate-800 font-medium text-sm flex items-center justify-center gap-1.5 transition-colors py-2"
            >
              <X size={14} /> Annuler la saisie
            </button>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <TriangleAlert size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-amber-800 text-xs italic leading-relaxed">
              Veuillez vérifier les pesées avant validation. Une fois enregistrée, la collecte
              génère un ordre de paiement automatique pour l'apporteur.
            </p>
          </div>

        </div>
      </div>
    </PageLayout>
  )
}
