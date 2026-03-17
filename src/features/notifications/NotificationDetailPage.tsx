import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageLayout } from '../../components/layout/PageLayout'
import { useNotifications, useMarkNotificationRead } from './hooks/useNotifications'
import { useToastStore } from '../../store/toastStore'
import type { NotificationType } from '../../types'
import {
  ArrowLeft, Bell, Package, CreditCard,
  PackageCheck, AlertTriangle, Import, Check,
} from 'lucide-react'

const typeMeta: Record<NotificationType, { label: string; color: string; icon: React.ReactNode }> = {
  NOUVELLE_COLLECTE: {
    label: 'NOUVELLE_COLLECTE',
    color: 'bg-blue-100 text-blue-700',
    icon: <Package size={20} />,
  },
  ACOMPTE_RECU: {
    label: 'ACOMPTE_RECU',
    color: 'bg-emerald-100 text-emerald-700',
    icon: <CreditCard size={20} />,
  },
  COMMANDE_PRETE: {
    label: 'COMMANDE_PRETE',
    color: 'bg-purple-100 text-purple-700',
    icon: <PackageCheck size={20} />,
  },
  COMMANDE_FINALISEE: {
    label: 'COMMANDE_FINALISEE',
    color: 'bg-emerald-100 text-emerald-700',
    icon: <Check size={20} />,
  },
  IMPORT_TERMINE: {
    label: 'IMPORT_TERMINE',
    color: 'bg-amber-100 text-amber-700',
    icon: <Import size={20} />,
  },
  COMMANDE_EN_ATTENTE: {
    label: 'COMMANDE_EN_ATTENTE',
    color: 'bg-amber-100 text-amber-700',
    icon: <AlertTriangle size={20} />,
  },
}

function formatDateLong(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useToastStore((s) => s.addToast)
  const { data = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()

  const notif = useMemo(
    () => data.find((n) => n.id === id),
    [data, id]
  )

  useEffect(() => {
    if (notif && !notif.lu) {
      markRead.mutate(notif.id)
    }
  }, [notif, markRead])

  if (isLoading) {
    return (
      <PageLayout title="Notification">
        <div className="p-8 text-slate-400">Chargement...</div>
      </PageLayout>
    )
  }

  if (!notif) {
    return (
      <PageLayout title="Notification">
        <div className="p-8">
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-2 text-slate-500 hover:text-[#2563EB] text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Retour aux notifications
          </button>
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6 text-slate-500">
            Notification introuvable.
          </div>
        </div>
      </PageLayout>
    )
  }

  const meta = typeMeta[notif.type] ?? {
    label: notif.type,
    color: 'bg-slate-100 text-slate-600',
    icon: <Bell size={20} />,
  }

  return (
    <PageLayout title="Notification">
      <div className="p-8 max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/notifications')}
          className="flex items-center gap-2 text-slate-500 hover:text-[#2563EB] text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Retour aux notifications
        </button>

        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className={`size-12 rounded-full ${meta.color} flex items-center justify-center shrink-0`}>
              {meta.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">{notif.message}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${meta.color}`}>
                  {meta.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{formatDateLong(notif.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Statut</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{notif.lu ? 'Lue' : 'Non lue'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Type</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">{notif.type}</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Lien</p>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {notif.lien ?? '—'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/notifications')}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Retour
            </button>
            {!notif.lu && (
              <button
                onClick={async () => {
                  try {
                    await markRead.mutateAsync(notif.id)
                    addToast('Notification marquée comme lue', 'success')
                  } catch {
                    addToast('Erreur lors du marquage', 'error')
                  }
                }}
                className="px-4 py-2 bg-[#2563EB] text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
              >
                Marquer comme lue
              </button>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
