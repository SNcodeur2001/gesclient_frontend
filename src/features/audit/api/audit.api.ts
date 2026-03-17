import api from '../../../lib/axios'
import type { AuditLogResponseDto, AuditLogListParams } from '../../../types'

export interface AuditListResponse {
  items: AuditLogResponseDto[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function fetchAuditLogs(params: AuditLogListParams): Promise<AuditListResponse> {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  const { data } = await api.get('/audit', { params: cleanParams })
  const raw = data?.data ?? data
  return {
    items: raw?.items ?? raw?.data ?? [],
    total: raw?.total ?? 0,
    page: raw?.page ?? params.page ?? 1,
    limit: raw?.limit ?? params.limit ?? 10,
    totalPages: raw?.totalPages ?? 1,
  }
}
