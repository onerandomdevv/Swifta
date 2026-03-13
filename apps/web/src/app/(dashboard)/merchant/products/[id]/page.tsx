import { MerchantProductDetailView } from "@/components/merchant/products/merchant-product-detail-view";

interface PageProps {
  params: {
    id: string;
  };
}

export default function MerchantProductDetailPage({ params }: PageProps) {
  return <MerchantProductDetailView productId={params.id} />;
}
