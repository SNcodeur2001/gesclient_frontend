import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationListParams,
} from '../api/notifications.api'
import { useToastStore } from '../../../store/toastStore'
import { getApiErrorMessage } from '../../../lib/apiError'

export function useNotifications(params?: NotificationListParams) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => fetchNotifications(params),
    staleTime: 1000 * 60 * 1,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id, { silent: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      addToast('Notification marquée comme lue', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Impossible de marquer la notification comme lue.'), 'error')
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: () => markAllNotificationsRead({ silent: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      addToast('Toutes les notifications sont marquées comme lues', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Impossible de marquer toutes les notifications comme lues.'), 'error')
    },
  })
}
