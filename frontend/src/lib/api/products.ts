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


export async function getProducts(params?: {
  category?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.category) {
    searchParams.append('category', params.category);
  }
  if (params?.page){
    searchParams.append('page', params.page.toString());
  }
  if (params?.limit){ 
    searchParams.append('limit', params.limit.toString());
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/products${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  const res = await fetch(url, {
    cache: 'no-store',
    next: { revalidate: 300 }, // Revalidate every 5 minutes
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch products: ${res.status}`);
  }

  return res.json();
}

export async function getProductsByCategory(categoryName: string): Promise<Product[]> {
  const data = await getProducts();
  
  return data.products.filter(product => 
    product.category.name.toLowerCase() === categoryName.toLowerCase()
  );
}


export async function getProduct(id: string): Promise<Product> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`, {
    cache: 'no-store',
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch product: ${res.status}`);
  }

  return res.json();
}

// for men
export async function getMensClothing(): Promise<Product[]> {
  return getProductsByCategory('Clothing');
}

