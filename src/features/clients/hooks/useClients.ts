import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchClients, fetchClient,
  createClient, updateClient, deleteClient,
  exportClientsCSV, exportClientsExcel, importClients,
  downloadClientsTemplate,
} from '../api/clients.api'
import type { ClientListParams, CreateClientDto, UpdateClientDto } from '../../../types'
import { useToastStore } from '../../../store/toastStore'
import { getApiErrorMessage } from '../../../lib/apiError'

// ─── Liste paginée ────────────────────────────────────────────────────────────

export function useClients(params: ClientListParams) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => fetchClients(params),
    staleTime: 1000 * 60 * 2,
    placeholderData: (prev) => prev,
  })
}

// ─── Détail ───────────────────────────────────────────────────────────────────

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => fetchClient(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  })
}

// ─── Création ─────────────────────────────────────────────────────────────────

export function useCreateClient() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: (dto: CreateClientDto) => createClient(dto, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      addToast('Client créé avec succès', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Impossible de créer le client.'), 'error')
    },
  })
}

// ─── Mise à jour ──────────────────────────────────────────────────────────────

export function useUpdateClient() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClientDto }) =>
      updateClient(id, dto, { silent: true }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', id] })
      addToast('Client mis à jour avec succès', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Impossible de mettre à jour le client.'), 'error')
    },
  })
}

// ─── Suppression ──────────────────────────────────────────────────────────────

export function useDeleteClient() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: (id: string) => deleteClient(id, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      addToast('Client supprimé avec succès', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Impossible de supprimer le client.'), 'error')
    },
  })
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

export function useExportClients() {
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: ({ format, params }: { format: 'csv' | 'excel'; params?: Partial<ClientListParams> }) => (
      format === 'excel'
        ? exportClientsExcel(params, { silent: true })
        : exportClientsCSV(params, { silent: true })
    ),
    onMutate: () => {
      addToast('Export en cours de préparation...', 'info')
    },
    onSuccess: (blob, vars) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = vars.format === 'excel' ? 'xlsx' : 'csv'
      a.download = `clients-${new Date().toISOString().split('T')[0]}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      addToast('Export téléchargé', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, "Erreur lors de l'export."), 'error')
    },
  })
}

// ─── Télécharger le modèle ───────────────────────────────────────────────────

export function useDownloadClientsTemplate() {
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: () => downloadClientsTemplate({ silent: true }),
    onSuccess: () => {
      addToast('Modèle téléchargé', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, 'Impossible de télécharger le modèle.'), 'error')
    },
  })
}

// ─── Import Excel ─────────────────────────────────────────────────────────────

export function useImportClients() {
  const queryClient = useQueryClient()
  const addToast = useToastStore((s) => s.addToast)
  return useMutation({
    mutationFn: (file: File) => importClients(file, { silent: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      addToast('Importation terminée.', 'success')
    },
    onError: (err) => {
      addToast(getApiErrorMessage(err, "Erreur lors de l'importation."), 'error')
    },
  })
}
