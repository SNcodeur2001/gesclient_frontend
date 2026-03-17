import api from '../../../lib/axios'
import type { NotificationResponseDto } from '../../../types'

export async function fetchNotifications(lu?: boolean): Promise<NotificationResponseDto[]> {
  const params = lu === undefined ? undefined : { lu }
  const { data } = await api.get('/notifications', { params })
  const raw = data?.data ?? data
  return (raw?.items ?? raw?.data ?? raw ?? []) as NotificationResponseDto[]
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/read`)
  return data
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch('/notifications/read-all')
  return data
}
