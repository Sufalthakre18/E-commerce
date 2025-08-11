export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string;
  category?: string;
}

export interface ProductResponse {
  success: boolean;
  products: Product[];
}