import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ShoppingCart, Truck,
  FileText, Bell, ClipboardList, LogOut
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '../../store/authStore'
import { Badge } from '../ui/Badge'
import type { Role } from '../../types'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
}

const navByRole: Record<Role, NavItem[]> = {
  DIRECTEUR: [
    { label: 'Tableau de bord', path: '/dashboard',      icon: <LayoutDashboard size={18} /> },
    { label: 'Clients',         path: '/clients',         icon: <Users size={18} /> },
    { label: 'Commandes',       path: '/commandes',       icon: <ShoppingCart size={18} /> },
    { label: 'Collectes',       path: '/collectes',       icon: <Truck size={18} /> },
    { label: 'Factures',        path: '/factures',        icon: <FileText size={18} /> },
    { label: 'Notifications',   path: '/notifications',   icon: <Bell size={18} /> },
    { label: 'Audit Trail',     path: '/audit',           icon: <ClipboardList size={18} /> },
  ],
  COMMERCIAL: [
    { label: 'Tableau de bord', path: '/dashboard',    icon: <LayoutDashboard size={18} /> },
    { label: 'Clients',         path: '/clients',       icon: <Users size={18} /> },
    { label: 'Commandes',       path: '/commandes',     icon: <ShoppingCart size={18} /> },
    { label: 'Notifications',   path: '/notifications', icon: <Bell size={18} /> },
  ],
  COLLECTEUR: [
    { label: 'Tableau de bord', path: '/dashboard',    icon: <LayoutDashboard size={18} /> },
    { label: 'Collectes',       path: '/collectes',     icon: <Truck size={18} /> },
    { label: 'Notifications',   path: '/notifications', icon: <Bell size={18} /> },
  ],
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  if (!user) return null

  const navItems = navByRole[user.role]
  const initials = `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-screen w-[260px] bg-[#1E293B] flex flex-col z-40">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight">GesClient</p>
            <p className="text-slate-400 text-xs">Proplast</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-[#2563EB] text-white font-medium'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user.prenom} {user.nom}
            </p>
            <Badge variant={user.role} className="mt-0.5" />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-full px-1"
        >
          <LogOut size={15} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}