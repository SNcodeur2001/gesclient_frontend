import { useQuery } from '@tanstack/react-query'
import { fetchFactures, fetchFacture } from '../api/factures.api'
import type { FactureListParams } from '../api/factures.api'

export function useFactures(params: FactureListParams) {
  return useQuery({
    queryKey: ['factures', params],
    queryFn: () => fetchFactures(params),
    staleTime: 1000 * 60 * 2,
    placeholderData: prev => prev,
  })
}

export function useFacture(id: string) {
  return useQuery({
    queryKey: ['factures', id],
    queryFn: () => fetchFacture(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}