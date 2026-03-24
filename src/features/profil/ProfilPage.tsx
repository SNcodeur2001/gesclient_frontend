import { PageLayout } from '../../components/layout/PageLayout'
import { useAuthStore } from '../../store/authStore'
import {
  User, Laptop, LogOut,
} from 'lucide-react'

function initials(nom?: string, prenom?: string) {
  const a = (prenom?.[0] ?? '').toUpperCase()
  const b = (nom?.[0] ?? '').toUpperCase()
  return (a + b) || '—'
}

function roleLabel(role?: string) {
  return role?.toUpperCase() ?? '—'
}

export function ProfilPage() {
  const { user } = useAuthStore()

  const fullName = user ? `${user.prenom ?? ''} ${user.nom ?? ''}`.trim() : '—'
  const email = user?.email ?? '—'
  const role = roleLabel(user?.role)

  return (
    <PageLayout title="Mon Profil">
      <div className="space-y-8">
        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mon Profil</h1>
          <p className="text-slate-500 text-base">Consultez et gérez vos informations personnelles.</p>
        </div>

        {/* Top Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations personnelles */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Informations personnelles</h3>
            </div>
            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center text-[#2563EB] font-bold text-2xl mb-4 border-2 border-blue-100">
                  {initials(user?.nom, user?.prenom)}
                </div>
                <h4 className="text-xl font-bold text-slate-900">{fullName || '—'}</h4>
                <span className="mt-2 inline-flex items-center bg-[#2563EB] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  {role}
                </span>
              </div>

              <hr className="border-slate-100 mb-6" />

              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Nom Complet</span>
                  <span className="text-slate-900 font-medium">{fullName || '—'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Email Professionnel</span>
                  <span className="text-slate-900 font-medium">{email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Rôle</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {role}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Statut du compte</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Actif
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Membre depuis</span>
                  <span className="text-slate-900 font-medium">—</span>
                </div>
              </div>

              <div className="mt-8">
                <button
                  className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-400 bg-slate-50 cursor-not-allowed rounded-lg py-2.5 font-bold transition-all"
                  disabled
                >
                  <User size={16} />
                  Modifier mes informations
                </button>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Sécurité</h3>
            </div>
            <div className="p-8 flex-1 flex flex-col">
              <div className="mb-8">
                <h4 className="font-bold text-slate-900 mb-2">Mot de passe</h4>
                <p className="text-slate-500 leading-relaxed">
                  Votre mot de passe doit être modifié via l&apos;administrateur système.
                </p>
              </div>
              <hr className="border-slate-100 mb-8" />
              <div className="mb-8 flex-1">
                <h4 className="font-bold text-slate-900 mb-4">Sessions actives</h4>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 shadow-sm text-slate-600">
                      <Laptop size={18} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">Session actuelle</p>
                      <p className="text-slate-500 text-xs">Dakar, Sénégal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-green-700 text-xs font-bold uppercase tracking-wide">Active maintenant</span>
                  </div>
                </div>
              </div>
              <div className="mt-auto pt-6">
                <button
                  className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-400 bg-red-50 cursor-not-allowed rounded-lg py-2.5 font-bold transition-all"
                  disabled
                >
                  <LogOut size={16} />
                  Se déconnecter de toutes les sessions
                </button>
                <p className="text-xs text-slate-400 mt-2 text-center">Fonctionnalité bientôt disponible.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
