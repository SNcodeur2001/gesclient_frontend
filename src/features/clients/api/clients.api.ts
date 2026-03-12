import api from '../../../lib/axios'
import type {
  ClientResponseDto,
  CreateClientDto,
  UpdateClientDto,
  ClientListParams,
  PaginatedResponse,
} from '../../../types'

export async function fetchClients(params: ClientListParams) {
  const { data } = await api.get('/clients', { params })
  const raw = data?.data
  return {
    items: (raw?.items ?? raw?.data ?? []) as ClientResponseDto[],
    total: raw?.total ?? 0,
    page: raw?.page ?? 1,
    limit: raw?.limit ?? 10,
    totalPages: raw?.totalPages ?? 1,
  }
}

export async function fetchClient(id: string) {
  const { data } = await api.get(`/clients/${id}`)
  return (data?.data ?? data) as ClientResponseDto
}

export async function createClient(dto: CreateClientDto) {
  const { data } = await api.post('/clients', dto)
  return (data?.data ?? data) as ClientResponseDto
}

export async function updateClient(id: string, dto: UpdateClientDto) {
  const { data } = await api.patch(`/clients/${id}`, dto)
  return (data?.data ?? data) as ClientResponseDto
}

export async function deleteClient(id: string) {
  await api.delete(`/clients/${id}`)
}

export async function exportClientsCSV(params?: Partial<ClientListParams>) {
  const response = await api.get('/clients/export', {
    params,
    responseType: 'blob',
  })
  return response.data as Blob
}

export async function importClients(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/clients/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data?.data ?? data
}