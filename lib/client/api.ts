// Client-side fetch wrapper. Throws on any non-OK response with the
// server-provided message, so callers never mistake failures for success.

export class ApiClientError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new ApiClientError('Network error — is the server running?', 0);
  }

  let body: any = {};
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    body = await res.json().catch(() => ({}));
  }

  if (!res.ok) {
    throw new ApiClientError(body?.error || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export const jsonBody = (data: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(data),
});
