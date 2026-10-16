const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status, responseBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function request(path, options = {}) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL must be configured before making API requests.');
  }

  const response = await fetch(`${API_BASE_URL}/${path.replace(/^\/+/, '')}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new ApiError(
      `API request failed with status ${response.status}.`,
      response.status,
      responseBody,
    );
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}
