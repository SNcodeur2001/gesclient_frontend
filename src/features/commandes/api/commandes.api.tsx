import api from '../../../lib/axios'
import type {
  CommandeResponseDto,
  CreateCommandeDto,
} from '../../../types'

export interface CommandeListParams {
  page?: number
  limit?: number
  search?: string
  statut?: string
  type?: string
  clientId?: string
  dateDebut?: string
  dateFin?: string
}

export async function fetchCommandes(params: CommandeListParams) {
  const { data } = await api.get('/commandes', { params })
  const raw = data?.data
  return {
    items: (raw?.items ?? raw?.data ?? []) as CommandeResponseDto[],
    total: raw?.total ?? 0,
    page: raw?.page ?? 1,
    limit: raw?.limit ?? 10,
    totalPages: raw?.totalPages ?? 1,
  }
}

export async function fetchCommande(id: string) {
  const { data } = await api.get(`/commandes/${id}`)
  return (data?.data ?? data) as CommandeResponseDto
}

export async function createCommande(dto: CreateCommandeDto) {
  const { data } = await api.post('/commandes', dto)
  return (data?.data ?? data) as CommandeResponseDto
}

export async function updateCommande(id: string, dto: Partial<CreateCommandeDto>) {
  const { data } = await api.patch(`/commandes/${id}`, dto)
  return (data?.data ?? data) as CommandeResponseDto
}

export async function deleteCommande(id: string) {
  await api.delete(`/commandes/${id}`)
}