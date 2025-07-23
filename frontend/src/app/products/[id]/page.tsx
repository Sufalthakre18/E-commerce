// app/products/[id]/page.tsx
import { getProduct } from '@/lib/api/products';
import { ProductDetail } from '@/components/products/ProductDetail';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <ProductDetail product={product} />;
}
