import api from '../../../lib/axios'
import type { FactureResponse, FactureListResponse, FactureType } from '../../../types'

export interface FactureListParams {
  page?: number
  limit?: number
  search?: string
  type?: FactureType | ''
  dateDebut?: string
  dateFin?: string
}

export async function fetchFactures(params: FactureListParams): Promise<FactureListResponse> {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  const { data } = await api.get('/factures', { params: cleanParams })
  // Normalise selon la structure backend
  if (data?.data && data?.pagination) return data as FactureListResponse
  if (Array.isArray(data?.data)) {
    return {
      data: data.data,
      pagination: {
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        total: data.total ?? data.data.length,
        totalPages: data.totalPages ?? 1,
      },
    }
  }
  return { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } }
}

export async function fetchFacture(id: string): Promise<FactureResponse> {
  const { data } = await api.get(`/factures/${id}`)
  return (data?.data ?? data) as FactureResponse
}

export async function downloadFacturePDF(id: string): Promise<Blob> {
  const { data } = await api.get(`/factures/${id}/pdf`, { responseType: 'blob' })
  return data as Blob
}
