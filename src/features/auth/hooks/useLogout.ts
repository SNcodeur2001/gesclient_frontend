import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import api from '../../../lib/axios'

interface UseLogoutReturn {
  logout: () => Promise<void>
  loading: boolean
}

export function useLogout(): UseLogoutReturn {
  const navigate = useNavigate()
  const { refreshToken, logout: clearAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const logout = async (): Promise<void> => {
    setLoading(true)
    try {
      // Appel API pour révoquer le refresh token côté serveur
      await api.post('/auth/logout', {
        refresh_token: refreshToken ?? undefined,
      })
    } catch {
      // On logout côté client même si l'API échoue
    } finally {
      clearAuth()
      setLoading(false)
      navigate('/login', { replace: true })
    }
  }

  return { logout, loading }
}