import { useQuery } from '@tanstack/react-query'
import { fetchAuditLogs } from '../api/audit.api'
import type { AuditLogListParams } from '../../../types'

export function useAuditLogs(params: AuditLogListParams) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => fetchAuditLogs(params),
    staleTime: 1000 * 60 * 2,
  })
}
