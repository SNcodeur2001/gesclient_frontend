import api from '../../../lib/axios'
import type {
  ClientResponseDto,
  CreateClientDto,
  UpdateClientDto,
  ClientListParams,
  ImportClientsResult,
} from '../../../types'

export async function fetchClients(params: ClientListParams) {
  const { data } = await api.get('/clients', { params })
  const raw = data?.data
  return {
    items: (raw?.items ?? raw?.data ?? []) as ClientResponseDto[],
    total: raw?.total ?? 0,
    totalActifs: raw?.totalActifs ?? 0,
    totalRevenue: raw?.totalRevenue ?? 0,
    page: raw?.page ?? 1,
    limit: raw?.limit ?? 10,
    totalPages: raw?.totalPages ?? 1,
  }
}

export async function fetchClient(id: string) {
  const { data } = await api.get(`/clients/${id}`)
  return (data?.data ?? data) as ClientResponseDto
}

export async function createClient(
  dto: CreateClientDto,
  options?: { silent?: boolean }
) {
  const { data } = await api.post('/clients', dto, {
    silent: options?.silent,
  })
  return (data?.data ?? data) as ClientResponseDto
}

export async function updateClient(
  id: string,
  dto: UpdateClientDto,
  options?: { silent?: boolean }
) {
  const { data } = await api.patch(`/clients/${id}`, dto, {
    silent: options?.silent,
  })
  return (data?.data ?? data) as ClientResponseDto
}

export async function deleteClient(id: string, options?: { silent?: boolean }) {
  await api.delete(`/clients/${id}`, { silent: options?.silent })
}

export async function exportClientsCSV(
  params?: Partial<ClientListParams>,
  options?: { silent?: boolean }
) {
  const response = await api.get('/clients/export', {
    params,
    responseType: 'blob',
    silent: options?.silent,
  })
  return response.data as Blob
}

export async function exportClientsExcel(
  params?: Partial<ClientListParams>,
  options?: { silent?: boolean }
) {
  const response = await api.get('/clients/export/excel', {
    params,
    responseType: 'blob',
    silent: options?.silent,
  })
  return response.data as Blob
}

export async function downloadClientsTemplate(options?: { silent?: boolean }) {
  const response = await api.get('/clients/template', {
    responseType: 'blob',
    silent: options?.silent,
  })
  return response.data as Blob
}

export async function importClients(
  file: File,
  options?: { silent?: boolean }
) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/clients/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    silent: options?.silent,
  })
  return (data?.data ?? data) as ImportClientsResult
}
