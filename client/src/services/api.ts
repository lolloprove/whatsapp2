const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const REQUEST_TIMEOUT_MS = 15000;

export interface SessionUser {
  id: string;
  username?: string;
  fullName?: string;
}

/**
 * Client REST verso il backend reale WhatsApp 2.
 * Nessun fallback mock: se il server non risponde, l'errore viene propagato.
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  sessionUser?: SessionUser
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (sessionUser) {
    headers['x-user-id'] = sessionUser.id;
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Il server non risponde (timeout). Verifica che il backend sia avviato.');
    }
    throw new Error('Server irraggiungibile. Verifica che il backend sia avviato sulla porta 5000.');
  }
  clearTimeout(timeoutId);

  const data = await response.json().catch(() => ({ success: false, error: `HTTP ${response.status}` }));
  if (!response.ok || data.success === false) {
    const error = new Error(data.error || `HTTP error ${response.status}`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return data;
}
