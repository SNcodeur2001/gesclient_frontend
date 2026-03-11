export type Role = 'DIRECTEUR' | 'COMMERCIAL' | 'COLLECTEUR'

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
}

export interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}