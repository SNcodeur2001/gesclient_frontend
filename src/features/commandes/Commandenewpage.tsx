import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { useCreateCommande } from './hooks/useCommandes'
import { useClients } from '../clients/hooks/useClients'
import type { CommandeType } from '../../types'
import {
  ArrowLeft, Store, Truck, Search,
  BookOpen, UserPlus, ChevronRight, Plus,
  Trash2, Info, CheckCircle2, ShieldCheck,
} from 'lucide-react'

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface ItemRow {
  id: number
  produit: string
  quantiteKg: number | ''
  prixUnitaire: number | ''
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('fr-FR').format(n) + ' FCFA'
}

let nextId = 1

function newRow(): ItemRow {
  return { id: nextId++, produit: '', quantiteKg: '', prixUnitaire: '' }
}

// ─── Type Card ────────────────────────────────────────────────────────────────

function TypeCard({
  selected, icon, title, subtitle, badge, onClick,
}: {
  selected: boolean; type: CommandeType
  icon: React.ReactNode; title: string; subtitle: string
  badge?: string; onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
        selected
          ? 'border-[#2563EB] bg-blue-50/50'
          : 'border-slate-100 hover:border-slate-200'
      }`}
    >
      {badge && (
        <span className="absolute top-3 right-3 px-2 py-0.5 bg-[#2563EB] text-white text-[10px] font-bold rounded uppercase">
          {badge}
        </span>
      )}
      <div className={`size-10 rounded-full flex items-center justify-center mb-2 ${
        selected ? 'bg-blue-100 text-[#2563EB]' : 'bg-slate-100 text-slate-500'
      }`}>
        {icon}
      </div>
      <p className="font-bold text-slate-800">{title}</p>
      <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
      {selected && (
        <CheckCircle2 size={20} className="absolute top-3 right-3 text-[#2563EB]" />
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function CommandeNewPage() {
  const navigate = useNavigate()
  const createMutation = useCreateCommande()

  // État formulaire
  const [type, setType] = useState<CommandeType>('SUR_PLACE')
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [showClientList, setShowClientList] = useState(false)
  const [items, setItems] = useState<ItemRow[]>([newRow()])

  // Recherche clients
  const { data: clientsData } = useClients({
    page: 1, limit: 10,
    search: clientSearch,
    type: 'ACHETEUR',
  })

  // Calculs résumé
  const sousTotal = useMemo(() => {
    return items.reduce((sum, row) => {
      const kg = Number(row.quantiteKg) || 0
      const pu = Number(row.prixUnitaire) || 0
      return sum + kg * pu
    }, 0)
  }, [items])

  const tva = type === 'A_DISTANCE' ? 0.2 : 0
  const tvaAmount = Math.round(sousTotal * tva)
  const totalTTC = sousTotal + tvaAmount
  const acompteMin = type === 'A_DISTANCE' ? Math.round(totalTTC * 0.5) : null

  // Gestion items
  const addItem = () => setItems(prev => [...prev, newRow()])

  const removeItem = (id: number) =>
    setItems(prev => prev.filter(r => r.id !== id))

  const updateItem = (id: number, field: keyof ItemRow, value: string) =>
    setItems(prev => prev.map(r =>
      r.id === id
        ? { ...r, [field]: field === 'produit' ? value : value === '' ? '' : Number(value) }
        : r
    ))

  // Soumission
  const handleSubmit = async () => {
    if (!selectedClientId) return

    const validItems = items.filter(
      r => r.produit && Number(r.quantiteKg) > 0 && Number(r.prixUnitaire) > 0
    )
    if (validItems.length === 0) return

    await createMutation.mutateAsync({
      type,
      acheteurId: selectedClientId,
      items: validItems.map(r => ({
        produit: r.produit,
        quantite: Number(r.quantiteKg),
        prixUnitaire: Number(r.prixUnitaire),
      })),
    })
    navigate('/commandes')
  }

  const selectedClient = clientsData?.items.find(c => c.id === selectedClientId)
  const canSubmit = !!selectedClientId && items.some(
    r => r.produit && Number(r.quantiteKg) > 0 && Number(r.prixUnitaire) > 0
  )

  return (
    <PageLayout title="Nouvelle Commande">
      <div className="max-w-6xl">

        {/* ── Breadcrumb ── */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <button
            onClick={() => navigate('/commandes')}
            className="hover:text-[#2563EB] flex items-center gap-1 transition-colors"
          >
            <ArrowLeft size={14} /> Retour aux commandes
          </button>
          <span>/</span>
          <span className="text-slate-400">Création d'une nouvelle vente</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Colonne gauche ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Type de commande */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-1">Type de commande</h3>
              <p className="text-slate-500 text-sm mb-5">
                Déterminez si la vente s'effectue sur place ou doit être livrée.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TypeCard
                  selected={type === 'SUR_PLACE'}
                  type="SUR_PLACE"
                  icon={<Store size={18} />}
                  title="Vente sur place"
                  subtitle="Pas de livraison, pas de TVA"
                  badge={type === 'SUR_PLACE' ? 'TVA 0%' : undefined}
                  onClick={() => setType('SUR_PLACE')}
                />
                <TypeCard
                  selected={type === 'A_DISTANCE'}
                  type="A_DISTANCE"
                  icon={<Truck size={18} />}
                  title="Vente à distance"
                  subtitle="Livraison incluse, TVA 20%"
                  badge={type === 'A_DISTANCE' ? 'TVA 20%' : undefined}
                  onClick={() => setType('A_DISTANCE')}
                />
              </div>
            </div>

            {/* Information Client */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-1">Information Client</h3>
              <p className="text-slate-500 text-sm mb-5">
                Sélectionnez un client existant ou créez-en un nouveau.
              </p>

              {/* Client sélectionné */}
              {selectedClient && (
                <div className="mb-4 flex items-center justify-between bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{selectedClient.nom}</p>
                    <p className="text-xs text-slate-500">{selectedClient.telephone ?? selectedClient.email ?? ''}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedClientId(null); setClientSearch('') }}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Changer
                  </button>
                </div>
              )}

              {/* Recherche */}
              {!selectedClient && (
                <div className="relative">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Search size={15} />
                      </span>
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={e => {
                          setClientSearch(e.target.value)
                          setShowClientList(true)
                        }}
                        onFocus={() => setShowClientList(true)}
                        placeholder="Rechercher par nom ou téléphone..."
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
                      />
                    </div>
                    <button className="px-4 py-2.5 border border-slate-200 rounded-lg text-slate-600 text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors">
                      <BookOpen size={15} /> Annuaire
                    </button>
                  </div>

                  {/* Dropdown résultats */}
                  {showClientList && clientsData && clientsData.items.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {clientsData.items.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClientId(c.id)
                            setClientSearch(c.nom)
                            setShowClientList(false)
                          }}
                          className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <p className="font-medium text-slate-800 text-sm">{c.nom}</p>
                          <p className="text-xs text-slate-400">{c.telephone ?? c.email ?? ''}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-50">
                <button
                  onClick={() => navigate('/clients/nouveau')}
                  className="w-full flex items-center justify-between py-2 px-3 text-[#2563EB] font-medium text-sm hover:bg-blue-50 rounded-lg transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <UserPlus size={15} /> Créer un nouveau client
                  </span>
                  <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Produits */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">Produits & Matériaux</h3>
                  <p className="text-slate-500 text-sm">
                    Ajoutez les produits plastiques commandés par le client.
                  </p>
                </div>
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-2 border border-[#2563EB] text-[#2563EB] text-xs font-bold rounded-lg hover:bg-blue-50 transition-colors uppercase tracking-wide"
                >
                  <Plus size={14} /> Ajouter un produit
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-3 pr-4">Produit / Désignation</th>
                      <th className="pb-3 px-4 w-32">Quantité (kg)</th>
                      <th className="pb-3 px-4 w-44">Prix Unitaire (FCFA)</th>
                      <th className="pb-3 pl-4 w-12 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map(row => (
                      <tr key={row.id}>
                        <td className="py-3 pr-4">
                          <input
                            type="text"
                            value={row.produit}
                            onChange={e => updateItem(row.id, 'produit', e.target.value)}
                            placeholder="Ex: Granules PEHD"
                            className="w-full bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={row.quantiteKg}
                            onChange={e => updateItem(row.id, 'quantiteKg', e.target.value)}
                            placeholder="0"
                            min={0}
                            className="w-full bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-sm text-center focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <input
                            type="number"
                            value={row.prixUnitaire}
                            onChange={e => updateItem(row.id, 'prixUnitaire', e.target.value)}
                            placeholder="0"
                            min={0}
                            className="w-full bg-slate-50 border border-transparent rounded-lg px-3 py-2 text-sm text-right focus:bg-white focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] outline-none transition"
                          />
                        </td>
                        <td className="py-3 pl-4 text-center">
                          <button
                            onClick={() => removeItem(row.id)}
                            disabled={items.length === 1}
                            className="text-slate-300 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex items-start gap-2 text-slate-400 text-xs italic">
                <Info size={12} className="mt-0.5 shrink-0" />
                <p>Les prix sont exprimés en Francs CFA (FCFA) hors taxes, sauf indication contraire.</p>
              </div>
            </div>
          </div>

          {/* ── Colonne droite sticky ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">

              {/* Résumé */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Résumé de la commande</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-slate-600 text-sm">
                    <span>Sous-total HT</span>
                    <span className="font-medium">{fmt(sousTotal)}</span>
                  </div>

                  {type === 'A_DISTANCE' && (
                    <div className="flex justify-between text-slate-600 text-sm">
                      <span>TVA 20%</span>
                      <span className="font-medium">{fmt(tvaAmount)}</span>
                    </div>
                  )}

                  <div className="h-px bg-slate-100" />

                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                      Total TTC
                    </span>
                    <span className="text-2xl font-bold text-[#2563EB]">{fmt(totalTTC)}</span>
                  </div>

                  <div className="pt-2 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Acompte minimum
                    </p>
                    <p className="text-sm font-medium text-slate-700">
                      {acompteMin != null ? fmt(acompteMin) : 'Non requis'}
                    </p>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit || createMutation.isPending}
                      className="w-full bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus size={18} />
                      {createMutation.isPending ? 'Création...' : 'Créer la commande'}
                    </button>
                    <button
                      onClick={() => navigate('/commandes')}
                      className="w-full py-2 text-slate-500 font-medium hover:text-slate-800 transition-colors text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>

              {/* Info card */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                <ShieldCheck size={18} className="text-[#2563EB] shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 font-medium leading-relaxed">
                  Cette vente sera instantanément enregistrée dans votre inventaire et votre journal de caisse.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </PageLayout>
  )
}