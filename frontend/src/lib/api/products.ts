export interface Product {
  id: string;
  name: string;
  description: string;
  details: string;
  price: number;
  stock: number;
  type: string; 
  categoryId: string;
  createdAt: string;
  category: {
    id: string;
    name: string;
    parent?: {
      id: string;
      name: string;
    } | null; 
  };
  images: Array<{
    id: string;
    url: string;
    publicId: string;
    productId: string;
  }>;
  sizes?: Array<{
    id: string;
    size: string;
    stock: number;
    productId: string;
  }>;
  variants?: Array<{
    id: string;
    color: string;
    colorCode: string;
    price: number;
    productId: string;
    images: Array<{
      id: string;
      url: string;
      publicId: string;
      variantId: string;
    }>;
  }>;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}




export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/products-with-reviews/${id}`, {
    cache: 'no-store',
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.status}`);
  }

  return res.json();
}

