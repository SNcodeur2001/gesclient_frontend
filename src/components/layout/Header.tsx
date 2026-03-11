import { Bell } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuthStore()
  const initials = `${user?.prenom?.[0] ?? ''}${user?.nom?.[0] ?? ''}`.toUpperCase()

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-white border-b border-[#E2E8F0] z-30 flex items-center justify-between px-6">

      {/* Titre page */}
      <h1 className="text-base font-semibold text-slate-800">{title}</h1>

      {/* Actions droite */}
      <div className="flex items-center gap-3">
        {/* Cloche notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold cursor-pointer">
          {initials}
        </div>
      </div>
    </header>
  )
}