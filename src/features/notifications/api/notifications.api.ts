import api from '../../../lib/axios'
import type { NotificationResponseDto } from '../../../types'

export interface NotificationListParams {
  lu?: boolean
  page?: number
  limit?: number
}

export interface NotificationListResponse {
  items: NotificationResponseDto[]
  total: number
  totalPages: number
  totalNonLues: number
  page: number
  limit: number
}

export async function fetchNotifications(
  params?: NotificationListParams
): Promise<NotificationListResponse> {
  const { data } = await api.get('/notifications', { params })
  const raw = data?.data ?? data
  return {
    items: (raw?.items ?? raw?.data ?? raw ?? []) as NotificationResponseDto[],
    total: raw?.total ?? 0,
    totalPages: raw?.totalPages ?? 1,
    totalNonLues: raw?.totalNonLues ?? 0,
    page: raw?.page ?? 1,
    limit: raw?.limit ?? 10,
  }
}

export async function markNotificationRead(
  id: string,
  options?: { silent?: boolean }
) {
  const { data } = await api.patch(`/notifications/${id}/read`, undefined, {
    silent: options?.silent,
  })
  return data
}

export async function markAllNotificationsRead(options?: { silent?: boolean }) {
  const { data } = await api.patch('/notifications/read-all', undefined, {
    silent: options?.silent,
  })
  return data
}
