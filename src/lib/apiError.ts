import axios from 'axios'

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue'
) {
  if (axios.isAxiosError(error)) {
    const data: any = error.response?.data
    const message =
      data?.message ??
      data?.error ??
      data?.errors?.[0]?.message ??
      data?.errors?.[0] ??
      data?.details ??
      error.message
    if (typeof message === 'string' && message.trim().length > 0) return message
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return fallback
}
