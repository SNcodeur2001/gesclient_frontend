import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchClients, fetchClient,
  createClient, updateClient, deleteClient,
  exportClientsCSV, importClients,
} from '../api/clients.api'
import type { ClientListParams, CreateClientDto, UpdateClientDto } from '../../../types'

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
  return useMutation({
    mutationFn: (dto: CreateClientDto) => createClient(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// ─── Mise à jour ──────────────────────────────────────────────────────────────

export function useUpdateClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClientDto }) =>
      updateClient(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', id] })
    },
  })
}

// ─── Suppression ──────────────────────────────────────────────────────────────

export function useDeleteClient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

// ─── Export CSV ───────────────────────────────────────────────────────────────

export function useExportClients() {
  return useMutation({
    mutationFn: (params?: Partial<ClientListParams>) => exportClientsCSV(params),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `clients-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    },
  })
}

// ─── Import Excel ─────────────────────────────────────────────────────────────

export function useImportClients() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => importClients(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}