import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { PageLayout } from '../../components/layout/PageLayout'
import { useAuthStore } from '../../store/authStore'
import { useClient, useCreateClient, useUpdateClient } from './hooks/useClients'
import type { CreateClientDto, ClientType } from '../../types'
import { ArrowLeft, Info, UserPlus, Save } from 'lucide-react'

// ─── Types form ───────────────────────────────────────────────────────────────

type ClientFormValues = {
  nom: string
  prenom?: string
  email?: string
  telephone?: string
  adresse?: string
  type: ClientType
  statut: 'ACTIF' | 'PROSPECT' | 'INACTIF'
  notes?: string
}

// ─── Composants champs ────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function Input({ error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        {...props}
        className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-slate-800 placeholder:text-slate-400 outline-none transition
          focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}
          ${props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}
        `}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function Select({
  error, children, ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: string }) {
  return (
    <div>
      <select
        {...props}
        className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm text-slate-800 outline-none transition
          focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB]
          ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}
          ${props.disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}
        `}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="size-2 rounded-full bg-[#2563EB] shrink-0" />
      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{children}</span>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ClientFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const { user } = useAuthStore()

  // Forcer le type selon le rôle
  const forcedType: ClientType | undefined =
    user?.role === 'COLLECTEUR' ? 'APPORTEUR' :
    user?.role === 'COMMERCIAL' ? 'ACHETEUR' :
    undefined

  const { data: existing, isLoading: loadingExisting } = useClient(id ?? '')
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    defaultValues: {
      statut: 'ACTIF',
      type: forcedType,
    },
  })

  // Remplir le form en mode édition
  useEffect(() => {
    if (isEdit && existing) {
      reset({
        nom: existing.nom,
        prenom: existing.prenom ?? '',
        email: existing.email ?? '',
        telephone: existing.telephone ?? '',
        adresse: existing.adresse ?? '',
        type: existing.type,
        statut: existing.statut as 'ACTIF' | 'PROSPECT' | 'INACTIF',
        notes: existing.notes ?? '',
      })
    }
  }, [existing, isEdit, reset])

  // Forcer le type si rôle restreint
  useEffect(() => {
    if (forcedType) setValue('type', forcedType)
  }, [forcedType, setValue])

  const onSubmit = async (values: ClientFormValues) => {
    const dto: CreateClientDto = {
      nom: values.nom,
      prenom: values.prenom || undefined,
      email: values.email || undefined,
      telephone: values.telephone || undefined,
      adresse: values.adresse || undefined,
      type: values.type,
      statut: values.statut,
      notes: values.notes || undefined,
    }

    if (isEdit && id) {
      await updateMutation.mutateAsync({ id, dto })
    } else {
      await createMutation.mutateAsync(dto)
    }

    navigate('/clients')
  }

  if (isEdit && loadingExisting) {
    return (
      <PageLayout title="Gestion des Clients">
        <div className="animate-pulse space-y-4 max-w-3xl">
          <div className="h-8 bg-slate-100 rounded w-48" />
          <div className="h-96 bg-slate-100 rounded-xl" />
        </div>
      </PageLayout>
    )
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <PageLayout title="Gestion des Clients">
      <div className="max-w-3xl space-y-6">

        {/* ── Retour ── */}
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#2563EB] transition-colors"
        >
          <ArrowLeft size={16} />
          Retour à la liste
        </button>

        {/* ── Titre ── */}
        <h1 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Modifier le client' : 'Nouveau client'}
        </h1>

        {/* ── Alerte champs obligatoires ── */}
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700">
          <Info size={16} className="shrink-0" />
          Les champs marqués d'un astérisque (*) sont obligatoires
        </div>

        {/* ── Formulaire ── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-8">
            <div>
              <h2 className="text-base font-semibold text-slate-800 mb-1">
                Informations d'identification
              </h2>
              <p className="text-sm text-slate-400">
                Veuillez renseigner les détails du client pour l'ajouter à la base commerciale.
              </p>
            </div>

            {/* ── IDENTITÉ ── */}
            <div>
              <SectionTitle>Identité</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label required>Nom</Label>
                  <Input
                    placeholder="Ex: DUPONT"
                    error={errors.nom?.message}
                    {...register('nom', { required: 'Le nom est obligatoire' })}
                  />
                </div>
                <div>
                  <Label>Prénom</Label>
                  <Input placeholder="Ex: Jean" {...register('prenom')} />
                </div>
              </div>
            </div>

            {/* ── COORDONNÉES ── */}
            <div>
              <SectionTitle>Coordonnées</SectionTitle>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="adresse@exemple.com"
                      error={errors.email?.message}
                      {...register('email', {
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Email invalide',
                        },
                      })}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      L'adresse sera utilisée pour l'envoi des factures.
                    </p>
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📞</span>
                      <input
                        type="tel"
                        placeholder="+33 0 00 00 00 00"
                        className="w-full pl-8 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition"
                        {...register('telephone')}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Adresse</Label>
                  <Input
                    placeholder="Numéro, rue, code postal et ville"
                    {...register('adresse')}
                  />
                </div>
              </div>
            </div>

            {/* ── CLASSIFICATION BUSINESS ── */}
            <div>
              <SectionTitle>Classification Business</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <Label required>Type</Label>
                  {forcedType ? (
                    // Champ masqué — type forcé selon le rôle
                    <div className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed">
                      {forcedType === 'APPORTEUR' ? 'Apporteur' : 'Acheteur'}
                    </div>
                  ) : (
                    <Select
                      error={errors.type?.message}
                      {...register('type', { required: 'Le type est obligatoire' })}
                    >
                      <option value="">Sélectionner le type</option>
                      <option value="APPORTEUR">Apporteur</option>
                      <option value="ACHETEUR">Acheteur</option>
                    </Select>
                  )}
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select {...register('statut')}>
                    <option value="ACTIF">Actif</option>
                    <option value="PROSPECT">Prospect</option>
                    <option value="INACTIF">Inactif</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* ── NOTES ── */}
            <div>
              <Label>Notes internes</Label>
              <textarea
                placeholder="Précisez ici les particularités de ce client..."
                rows={4}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] transition resize-none"
                {...register('notes')}
              />
              <p className="text-xs text-slate-400 mt-1">
                Ces notes ne sont pas visibles par le client sur ses documents officiels.
              </p>
            </div>

            {/* ── Actions ── */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {isEdit ? <Save size={16} /> : <UserPlus size={16} />}
                {isLoading
                  ? (isEdit ? 'Enregistrement...' : 'Création...')
                  : (isEdit ? 'Enregistrer' : 'Créer le client')
                }
              </button>
            </div>
          </div>
        </form>

        {/* ── Info card bas ── */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 flex gap-4">
          <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
            <UserPlus size={18} className="text-[#2563EB]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Pourquoi créer un client ?</p>
            <p className="text-sm text-slate-500 leading-relaxed">
              L'ajout d'un client vous permet d'initier de nouvelles transactions commerciales,
              de générer des devis personnalisés et de suivre l'historique complet de vos interactions.
              Assurez-vous de bien classifier le client pour des rapports analytiques précis.
            </p>
          </div>
        </div>

      </div>
    </PageLayout>
  )
}