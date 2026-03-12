import api from '../../../lib/axios'
import type { DashboardResponse } from '../../../types'

export async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get('/stats/dashboard')
  return data.data ?? data
}