import axios from 'axios'

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Une erreur est survenue'
) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined
    const errors = Array.isArray(data?.errors) ? data?.errors : undefined
    const firstError = errors?.[0] as Record<string, unknown> | string | undefined

    const message =
      (typeof data?.message === 'string' ? data.message : undefined) ??
      (typeof data?.error === 'string' ? data.error : undefined) ??
      (typeof firstError === 'string' ? firstError : undefined) ??
      (typeof firstError === 'object' && firstError && typeof firstError.message === 'string'
        ? firstError.message
        : undefined) ??
      (typeof data?.details === 'string' ? data.details : undefined) ??
      error.message

    if (typeof message === 'string' && message.trim().length > 0) return message
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return fallback
}
