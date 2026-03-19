"use client";

import { useParams } from "next/navigation";
import { ProductDetailView } from "@/components/shared/product-detail-view";

export default function BuyerProductDetailPage() {
  const { id } = useParams();

  if (!id || typeof id !== "string") {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500 font-bold uppercase tracking-widest">Invalid Product ID</p>
      </div>
    );
  }

  return <ProductDetailView productId={id} isOwner={false} />;
}
