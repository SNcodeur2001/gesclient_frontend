import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Link } from 'react-router-dom'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuthStore()
  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-8">

      {/* Titre page */}
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>

      {/* Actions droite */}
      <div className="flex items-center gap-3">
        {/* Recherche */}
        <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Search size={20} />
        </button>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        </Link>

        {/* Séparateur */}
        <div className="h-6 w-px bg-slate-200 mx-1" />

        {/* Date */}
        <p className="text-sm font-medium text-slate-500 hidden sm:block">
          Le {today}
        </p>
      </div>
    </header>
  )
}