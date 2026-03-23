import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchCommandes, fetchCommande,
  createCommande, updateCommande, deleteCommande,
} from '../api/commandes.api'
import type { CommandeListParams } from '../api/commandes.api'
import type { CreateCommandeDto } from '../../../types'
import { useToastStore } from '../../../store/toastStore'
import { getApiErrorMessage } from '../../../lib/apiError'

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
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: (dto: CreateCommandeDto) => createCommande(dto, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      addToast('Commande créée avec succès', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, "Échec de la création de la commande"), 'error')
    },
  })
}

export function useUpdateCommande() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateCommandeDto> }) =>
      updateCommande(id, dto, { silent: true }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      queryClient.invalidateQueries({ queryKey: ['commandes', id] })
      addToast('Commande mise à jour avec succès', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Erreur lors de la mise à jour'), 'error')
    },
  })
}

export function useDeleteCommande() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: (id: string) => deleteCommande(id, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commandes'] })
      addToast('Commande supprimée avec succès', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Erreur lors de la suppression'), 'error')
    },
  })
}
