import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import type { Role } from '../../types'

interface AuthGuardProps {
  allowedRoles?: Role[]
}

export function AuthGuard({ allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, user } = useAuthStore()

  // Non connecté → login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  // Rôle non autorisé → dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}