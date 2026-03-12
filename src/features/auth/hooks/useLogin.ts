import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../lib/axios'
import type { User } from '../../../types'

interface LoginCredentials {
  email: string
  password: string
}

interface UseLoginReturn {
  login: (credentials: LoginCredentials) => Promise<boolean>
  loading: boolean
  error: string | null
}

export function useLogin(): UseLoginReturn {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const login = async ({ email, password }: LoginCredentials): Promise<boolean> => {
    setError(null)
    setLoading(true)

    try {
      // 1. Login → récupérer les tokens
      const { data: loginData } = await api.post('/auth/login', { email, password })

      const accessToken: string = loginData.data?.access_token ?? loginData.access_token
      const refreshToken: string = loginData.data?.refresh_token ?? loginData.refresh_token

      if (!accessToken || !refreshToken) {
        setError('Réponse du serveur invalide.')
        return false
      }

      // 2. Stocker temporairement le token pour appeler /me
      useAuthStore.getState().setAuth(
        { id: '', nom: '', prenom: '', email: '', role: 'COMMERCIAL' },
        accessToken,
        refreshToken
      )

      // 3. Récupérer le vrai profil utilisateur
      const { data: meData } = await api.get('/auth/me')
      const user: User = meData.data ?? meData

      // 4. Stocker auth complète avec le vrai user
      setAuth(user, accessToken, refreshToken)

      // 5. Redirection selon le rôle
      navigate('/dashboard', { replace: true })
      return true

    } catch (err: any) {
      // Nettoyer le store en cas d'erreur
      useAuthStore.getState().logout()

      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect.')
      } else if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}