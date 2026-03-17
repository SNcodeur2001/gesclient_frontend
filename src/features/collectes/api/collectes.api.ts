import api from '../../../lib/axios'
import type { CollecteResponseDto, CreateCollecteDto } from '../../../types'

export interface CollecteListParams {
  page?: number
  limit?: number
  search?: string
  dateDebut?: string
  dateFin?: string
  apporteurId?: string
  collecteurId?: string
}

export interface CollecteListResponse {
  items: CollecteResponseDto[]
  total: number
  page: number
  limit: number
  totalPages: number
  tonnageTotal: number
  montantTotal: number
}

export async function fetchCollectes(params: CollecteListParams): Promise<CollecteListResponse> {
  const { data } = await api.get('/collectes', { params })
  const raw = data?.data
  return {
    items: raw?.items ?? [],
    total: raw?.total ?? 0,
    page: raw?.page ?? 1,
    limit: raw?.limit ?? 10,
    totalPages: raw?.totalPages ?? 1,
    tonnageTotal: raw?.tonnageTotal ?? 0,
    montantTotal: raw?.montantTotal ?? 0,
  }
}

export async function fetchCollecte(id: string) {
  const { data } = await api.get(`/collectes/${id}`)
  return (data?.data ?? data) as CollecteResponseDto
}

export async function createCollecte(
  dto: CreateCollecteDto,
  options?: { silent?: boolean }
) {
  const { data } = await api.post('/collectes', dto, {
    silent: options?.silent,
  })
  return (data?.data ?? data) as CollecteResponseDto
}

export async function deleteCollecte(
  id: string,
  options?: { silent?: boolean }
) {
  await api.delete(`/collectes/${id}`, {
    silent: options?.silent,
  })
}
