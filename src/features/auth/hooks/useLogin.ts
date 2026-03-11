import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../lib/axios'
import type { User, Role } from '../../../types'

interface LoginResponse {
  success: boolean
  data: {
    access_token: string
    refresh_token: string
  }
}

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
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
      
      const token = data.data?.access_token
      if (!token) {
        setError('Token non reçu')
        return false
      }

      // Créer un user factice - l'API ne retourne pas les infos utilisateur
      const user: User = {
        id: email,
        email,
        nom: 'User',
        prenom: '',
        role: 'DIRECTEUR' as Role,
      }

      setAuth(user, token)
      navigate('/dashboard', { replace: true })
      return true
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect.')
      } else {
        setError(err.response?.data?.message || 'Une erreur est survenue.')
      }
      return false
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}
