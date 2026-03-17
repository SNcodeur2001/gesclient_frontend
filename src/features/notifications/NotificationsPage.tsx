import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from './hooks/useNotifications'
import { useToastStore } from '../../store/toastStore'
import type { NotificationResponseDto, NotificationType } from '../../types'
import {
  Bell, Check, Package, CreditCard,
  PackageCheck, AlertTriangle, Import,
} from 'lucide-react'

const typeMeta: Record<NotificationType, { label: string; color: string; icon: React.ReactNode }> = {
  NOUVELLE_COLLECTE: {
    label: 'NOUVELLE_COLLECTE',
    color: 'bg-blue-100 text-blue-700',
    icon: <Package size={18} />,
  },
  ACOMPTE_RECU: {
    label: 'ACOMPTE_RECU',
    color: 'bg-emerald-100 text-emerald-700',
    icon: <CreditCard size={18} />,
  },
  COMMANDE_PRETE: {
    label: 'COMMANDE_PRETE',
    color: 'bg-purple-100 text-purple-700',
    icon: <PackageCheck size={18} />,
  },
  COMMANDE_FINALISEE: {
    label: 'COMMANDE_FINALISEE',
    color: 'bg-emerald-100 text-emerald-700',
    icon: <Check size={18} />,
  },
  IMPORT_TERMINE: {
    label: 'IMPORT_TERMINE',
    color: 'bg-amber-100 text-amber-700',
    icon: <Import size={18} />,
  },
  COMMANDE_EN_ATTENTE: {
    label: 'COMMANDE_EN_ATTENTE',
    color: 'bg-amber-100 text-amber-700',
    icon: <AlertTriangle size={18} />,
  },
}

function timeAgo(iso: string) {
  const now = Date.now()
  const t = new Date(iso).getTime()
  const diff = Math.max(0, now - t)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.floor(hours / 24)
  return `il y a ${days} jour${days > 1 ? 's' : ''}`
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const [tab, setTab] = useState<'all' | 'unread' | 'read'>('all')

  const { data: all = [], isLoading } = useNotifications()
  const markAll = useMarkAllNotificationsRead()
  const markOne = useMarkNotificationRead()

  const unreadCount = all.filter(n => !n.lu).length

  const list = useMemo(() => {
    if (tab === 'unread') return all.filter(n => !n.lu)
    if (tab === 'read') return all.filter(n => n.lu)
    return all
  }, [all, tab])

  const handleMarkAll = async () => {
    try {
      await markAll.mutateAsync()
      addToast('Toutes les notifications sont marquées comme lues', 'success')
    } catch {
      addToast('Erreur lors du marquage', 'error')
    }
  }

  const handleOpen = async (n: NotificationResponseDto) => {
    if (!n.lu) {
      try {
        await markOne.mutateAsync(n.id)
      } catch {
        // ignore
      }
    }
    navigate(`/notifications/${n.id}`)
  }

  return (
    <PageLayout title="Notifications">
      <div className="p-2">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Centre de Notifications</h2>
              <p className="text-slate-500 mt-1">Gérez vos alertes opérationnelles et le suivi de vos activités.</p>
            </div>
            <button
              onClick={handleMarkAll}
              disabled={markAll.isPending || unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-shadow shadow-sm disabled:opacity-50"
            >
              <Check size={16} />
              Tout marquer comme lu
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <div className="flex items-center justify-between px-6 border-b border-slate-100">
              <div className="flex gap-8">
                <button
                  onClick={() => setTab('all')}
                  className={`py-4 border-b-2 text-sm font-bold ${
                    tab === 'all' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Toutes
                </button>
                <button
                  onClick={() => setTab('unread')}
                  className={`py-4 border-b-2 text-sm font-semibold flex items-center gap-2 ${
                    tab === 'unread' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Non lues
                  <span className="bg-[#2563EB] text-white text-[10px] px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                </button>
                <button
                  onClick={() => setTab('read')}
                  className={`py-4 border-b-2 text-sm font-semibold ${
                    tab === 'read' ? 'border-[#2563EB] text-[#2563EB]' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Lues
                </button>
              </div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                {list.length} notification{list.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="p-8 text-center text-slate-400">Chargement...</div>
              ) : list.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Aucune notification</div>
              ) : (
                list.map((n) => {
                  const meta = typeMeta[n.type] ?? {
                    label: n.type,
                    color: 'bg-slate-100 text-slate-600',
                    icon: <Bell size={18} />,
                  }
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleOpen(n)}
                      className="w-full text-left p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors"
                    >
                      <div className={`size-11 rounded-full ${meta.color} flex items-center justify-center shrink-0`}>
                        {meta.icon}
                      </div>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`text-sm ${n.lu ? 'font-medium' : 'font-bold'} text-slate-900`}>
                            {n.message}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${meta.color}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.lu ? <div className="size-2.5 bg-[#2563EB] rounded-full" /> : <div className="size-2.5 opacity-0" />}
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <footer className="mt-8 mb-12 flex justify-center">
            <p className="text-slate-400 text-xs italic">Les notifications sont conservées pendant 30 jours.</p>
          </footer>
        </div>
      </div>
    </PageLayout>
  )
}
