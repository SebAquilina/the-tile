import { Suspense } from "react";
import { getAllProducts, getEffectCategories, getAllBrands } from "@/lib/seed";
import { ProductAdminList } from "./ProductAdminList";

export default function AdminProductsPage() {
  const products = getAllProducts();
  const effects = getEffectCategories();
  const brands = getAllBrands();

  return (
    <Suspense fallback={null}>
      <ProductAdminList products={products} effects={effects} brands={brands} />
    </Suspense>
  );
}
