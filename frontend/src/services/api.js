import axios from 'axios';

// Single configured instance; the base URL comes only from the environment.
const http = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),
  timeout: 8000,
  headers: { Accept: 'application/json' },
});

/**
 * @param {{ q?: string, limit?: number, offset?: number }} params
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ items: Array, total: number, limit: number, offset: number }>}
 */
export async function searchEmployees({ q = '', limit = 20, offset = 0 } = {}, signal) {
  const params = { limit, offset };
  if (q) params.search = q;
  const { data } = await http.get('/api/v1/employees', { params, signal });
  return data;
}

export const isCanceled = (err) => axios.isCancel(err);

/** Converts any thrown error into a safe, user-facing message. */
export function getErrorMessage(err) {
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (err?.response) {
    const apiMessage = err.response.data?.error?.message;
    if (err.response.status === 400 && apiMessage) return apiMessage;
    if (err.response.status >= 500) return 'The server ran into a problem. Please try again shortly.';
    return 'Something went wrong while loading employees.';
  }
  return 'Cannot reach the server. Check your connection and try again.';
}
