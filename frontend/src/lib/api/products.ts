

export async function getProducts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`, {
    next: { revalidate: 60 }, // ISR cache
  });

  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}


export async function getProduct(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to fetch product');
  return res.json();
}

