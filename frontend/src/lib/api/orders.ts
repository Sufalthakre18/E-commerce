
import { getAuthToken } from '@/lib/utils/auth';

export async function getUserOrders() {
  const token = getAuthToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/order/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch orders');
  }

  return res.json();
}
