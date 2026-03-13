import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCollectes, fetchCollecte,
  createCollecte, deleteCollecte,
} from '../api/collectes.api'
import type { CollecteListParams } from '../api/collectes.api'
import type { CreateCollecteDto } from '../../../types'

export function useCollectes(params: CollecteListParams) {
  return useQuery({
    queryKey: ['collectes', params],
    queryFn: () => fetchCollectes(params),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  })
}

export function useCollecte(id: string) {
  return useQuery({
    queryKey: ['collectes', id],
    queryFn: () => fetchCollecte(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateCollecte() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCollecteDto) => createCollecte(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
    },
  })
}

export function useDeleteCollecte() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCollecte(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
    },
  })
}