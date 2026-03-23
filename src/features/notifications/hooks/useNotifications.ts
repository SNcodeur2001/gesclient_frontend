import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../api/notifications.api'
import { useToastStore } from '../../../store/toastStore'

export function useNotifications(lu?: boolean) {
  return useQuery({
    queryKey: ['notifications', { lu }],
    queryFn: () => fetchNotifications(lu),
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
