import { getAuthToken } from '@/lib/utils/auth';

export async function fetchWrapper(url: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  const headers = {
    ...options.headers,
  } as Record<string, string>;

  // Only set Authorization header if token exists and URL is an API endpoint
  if (token && url.includes('/api/')) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`Adding Authorization header for ${url}: Bearer ${token}`);
  } else {
    console.log(`No token or non-API URL for ${url}`);
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error(`Non-JSON response for ${url}: ${text}`);
      throw new Error(`Expected JSON, received ${contentType || 'no content-type'}`);
    }

    const data = await response.json();
    if (!response.ok) {
      console.error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`, data);
      throw new Error(data.message || `Request failed: ${response.status}`);
    }
    console.log(`Fetch succeeded for ${url}:`, data);
    return data;
  } catch (error: any) {
    console.error(`Error in fetchWrapper for ${url}:`, error.message);
    throw error;
  }
}