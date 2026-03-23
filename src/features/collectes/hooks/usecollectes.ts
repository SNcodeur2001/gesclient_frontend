import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCollectes, fetchCollecte,
  createCollecte, deleteCollecte,
} from '../api/collectes.api'
import type { CollecteListParams } from '../api/collectes.api'
import type { CreateCollecteDto } from '../../../types'
import { useToastStore } from '../../../store/toastStore'
import { getApiErrorMessage } from '../../../lib/apiError'

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
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: (dto: CreateCollecteDto) => createCollecte(dto, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
      addToast('Collecte enregistrée avec succès', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, "Échec de l'enregistrement de la collecte"), 'error')
    },
  })
}

export function useDeleteCollecte() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: (id: string) => deleteCollecte(id, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
      addToast('Collecte supprimée avec succès', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Erreur lors de la suppression'), 'error')
    },
  })
}
