// Build query string from filters
export function buildProductQuery(filters: Record<string, any>) {
  const query = new URLSearchParams();
  for (const key in filters) {
    if (filters[key] !== undefined && filters[key] !== '') {
      query.set(key, String(filters[key]));
    }
  }
  return query.toString();
}
