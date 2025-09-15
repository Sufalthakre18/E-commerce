// ProductPage.tsx
import ProductDetail from "@/components/products/ProductDetail";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

async function getProduct(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/products-with-reviews/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch product: ${res.status} ${res.statusText}`);
    }
    const response = await res.json();
    // Extract the product from the { success, data } wrapper
    if (!response.success || !response.data) {
      throw new Error("Invalid response format or product not found");
    }
    return response.data; // Return the entire data object (product + similarProducts)
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  let data = null;
  try {
    data = await getProduct(id);
  } catch (error) {
    console.error("ProductPage error:", error);
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h2 className="text-2xl font-light text-gray-900">Unable to Load Product</h2>
          <p className="text-gray-600">We couldn't fetch the product details. Please try again later.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }
  return (
    <main className="min-h-screen bg-white">
      <ProductDetail data={data} />
    </main>
  );
}