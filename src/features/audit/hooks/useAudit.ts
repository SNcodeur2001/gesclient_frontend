import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs, fetchAuditLog } from '../api/audit.api'
import type { AuditLogResponseDto } from '../../../types'
import type { AuditLogListParams } from '../../../types'

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => fetchAuditLogs(params),
    staleTime: 1000 * 60 * 2,
  })
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: ['audit', id],
    queryFn: () => fetchAuditLog(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}
