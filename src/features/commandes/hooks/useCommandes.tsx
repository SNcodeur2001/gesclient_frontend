import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCommandes, fetchCommande,
  createCommande, updateCommande, deleteCommande,
} from '../api/commandes.api'
import type { CommandeListParams } from '../api/commandes.api'
import type { CreateCommandeDto } from '../../../types'

export function useCommandes(params: CommandeListParams) {
  return useQuery({
    queryKey: ['commandes', params],
    queryFn: () => fetchCommandes(params),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  })
}

export function useCommande(id: string) {
  return useQuery({
    queryKey: ['commandes', id],
    queryFn: () => fetchCommande(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateCommande() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateCommandeDto) => createCommande(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
    },
  })
}

export function useUpdateCommande() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateCommandeDto> }) =>
      updateCommande(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      queryClient.invalidateQueries({ queryKey: ['commandes', id] })
    },
  })
}

export function useDeleteCommande() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCommande(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
    },
  })
}