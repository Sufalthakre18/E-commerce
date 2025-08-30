import { getAuthToken } from '@/lib/utils/auth';

export async function fetchWrapper(url: string, options: RequestInit & { responseType?: 'json' | 'blob' } = {}) {
  const token = await getAuthToken();
  const headers = {
    ...options.headers,
  } as Record<string, string>;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.debug('fetchWrapper: attaching Authorization header', { url, tokenPreview: token?.slice(0, 10) + '...' });
  } else {
    console.debug('fetchWrapper: no token available', { url });
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 0) {
      throw new Error('Network or CORS issue (status 0). Ensure backend reachable and CORS configured.');
    }

    if (!response.ok) {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: text || 'Request failed' };
      }
      console.error(`Fetch failed for ${url}: ${response.status}`, errorData);
      throw new Error(errorData.error || errorData.message || `Request failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (options.responseType === 'blob') {
      if (!contentType || !contentType.includes('application/octet-stream')) {
        throw new Error(`Expected octet-stream, received ${contentType || 'no content-type'}`);
      }
      return response; // Return raw response for blob handling
    }

    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (!text) return null;
      throw new Error(`Expected JSON, received ${contentType || 'no content-type'}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`Error in fetchWrapper for ${url}:`, error);
    throw error;
  }
}