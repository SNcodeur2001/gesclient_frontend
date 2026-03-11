import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

export function LoginPage() {
  const { isAuthenticated, setAuth } = useAuthStore()

  // Déjà connecté → dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  // Login de test rapide (sera remplacé par le vrai formulaire)
  const loginTest = (role: 'DIRECTEUR' | 'COMMERCIAL' | 'COLLECTEUR') => {
    setAuth(
      {
        id: '1',
        nom: role === 'DIRECTEUR' ? 'Diop' : role === 'COMMERCIAL' ? 'Sow' : 'Mbaye',
        prenom: role === 'DIRECTEUR' ? 'Moussa' : role === 'COMMERCIAL' ? 'Aminata' : 'Cheikh',
        email: `${role.toLowerCase()}@proplast.com`,
        role,
      },
      'fake-token-dev'
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 w-full max-w-sm text-center">

        {/* Logo */}
        <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-1">GesClient</h1>
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-8">Proplast</p>

        <p className="text-sm text-slate-500 mb-4">Connexion rapide (dev)</p>

        <div className="space-y-3">
          <button
            onClick={() => loginTest('DIRECTEUR')}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Se connecter en tant que DIRECTEUR
          </button>
          <button
            onClick={() => loginTest('COMMERCIAL')}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Se connecter en tant que COMMERCIAL
          </button>
          <button
            onClick={() => loginTest('COLLECTEUR')}
            className="w-full py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            Se connecter en tant que COLLECTEUR
          </button>
        </div>
      </div>
    </div>
  )
}