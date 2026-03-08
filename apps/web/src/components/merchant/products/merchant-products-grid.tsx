import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Product } from "@hardware-os/shared";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

interface Props {
  products: Product[];
  onDelist: (productId: string) => Promise<void>;
}

export function MerchantProductsGrid({ products, onDelist }: Props) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await onDelist(deletingId);
      setDeletingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] shadow-sm">
        <div className="size-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700">
          <span className="material-symbols-outlined text-4xl text-slate-200">
            shopping_bag
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
            Catalog is Empty
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            List your products to start receiving quote requests.
          </p>
        </div>
        <Link
          href="/merchant/products/new"
          className="px-8 py-4 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/10 transition-all hover:scale-105 active:scale-95"
        >
          Add First Listing
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 group"
          >
            <div className="h-48 bg-slate-50 dark:bg-slate-800 relative flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <span className="material-symbols-outlined text-6xl text-slate-200 group-hover:scale-125 transition-transform duration-700">
                  products
                </span>
              )}
              <div className="absolute top-6 left-6 px-3 py-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-navy-dark dark:text-white shadow-sm">
                {product.categoryTag}
              </div>
              {!product.isActive && (
                <div className="absolute top-6 right-6 px-3 py-1 bg-red-500/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-sm">
                  Inactive
                </div>
              )}
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-1">
                <h3 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  ID: {product.id.slice(0, 8)}
                </p>
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Unit
                  </p>
                  <p className="text-sm font-black text-navy-dark dark:text-white">
                    {product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Min Order
                  </p>
                  <p className="text-sm font-black text-navy-dark dark:text-white">
                    {product.minOrderQuantity.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Price Details */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                    Unit Price
                  </p>
                  <p className="text-sm font-black text-navy-dark dark:text-emerald-500">
                    {product.pricePerUnitKobo
                      ? (Number(product.pricePerUnitKobo) / 100).toLocaleString(
                          "en-NG",
                          {
                            style: "currency",
                            currency: "NGN",
                          },
                        )
                      : "No price (RFQ only)"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() =>
                    router.push(`/merchant/products/${product.id}/edit`)
                  }
                  className="py-3 bg-slate-50 dark:bg-slate-800 text-navy-dark dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeletingId(product.id)}
                  className="py-3 border-2 border-slate-50 dark:border-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-red-100 hover:text-red-500 transition-colors"
                >
                  Delist
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
