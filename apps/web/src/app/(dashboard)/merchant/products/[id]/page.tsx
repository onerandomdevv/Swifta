"use client";

import { useParams } from "next/navigation";
import { ProductDetailView } from "@/components/shared/product-detail-view";

export default function MerchantProductDetailPage() {
  const { id } = useParams();

  if (!id || typeof id !== "string") {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-500 font-bold uppercase tracking-widest">Invalid Product ID</p>
      </div>
    );
  }

  // On the merchant product detail page, we assume the user is the owner 
  // because this route is under (dashboard)/merchant.
  // The specific ownership check is done inside the component if needed, 
  // but here we set isOwner={true} to enable merchant actions.
  return <ProductDetailView productId={id} isOwner={true} />;
}
