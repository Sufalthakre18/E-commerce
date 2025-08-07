import ProductDetail from "@/components/products/ProductDetail";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
}

export default async function ProductPage({ params }: PageProps) {
  // Await the params before accessing its properties
  const { id } = await params;
  const product = await getProduct(id);

  return (
    <main className="min-h-screen bg-white">
      <ProductDetail product={product} />
    </main>
  );
}