import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationListParams,
} from '../api/notifications.api'
import { useToastStore } from '../../../store/toastStore'

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
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      addToast('Notification marquée comme lue', 'success')
    },
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      addToast('Toutes les notifications sont marquées comme lues', 'success')
    },
  })
}
