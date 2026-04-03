import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Product } from "@twizrr/shared";
import { toast } from "sonner";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

interface Props {
  products: Product[];
  onDelist: (productId: string) => Promise<void>;
  onRepost: (product: Product) => void;
  onAddClick?: () => void;
}

export function MerchantProductsGrid({ products, onDelist, onRepost, onAddClick }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await onDelist(deletingId);
      setDeletingId(null);
    }
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center space-y-8 bg-surface border border-border rounded-[3rem] shadow-sm">
        <div className="size-24 rounded-[2rem] bg-background-secondary flex items-center justify-center border border-border-light">
          <span className="material-symbols-outlined text-4xl text-border">
            shopping_bag
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
            Catalog is Empty
          </h3>
          <p className="text-[10px] font-black text-foreground-muted uppercase tracking-widest">
            List your products to start selling to buyers.
          </p>
        </div>
        <button
          onClick={onAddClick}
          className="px-8 py-4 bg-foreground text-background rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-foreground/10 transition-all hover:scale-105 active:scale-95"
        >
          Add First Listing
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-surface border border-border rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all duration-500 group"
          >
            <div className="h-48 bg-background-secondary relative flex items-center justify-center overflow-hidden">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <span className="material-symbols-outlined text-6xl text-border group-hover:scale-125 transition-transform duration-700">
                  products
                </span>
              )}
              <div className="absolute top-6 left-6 px-3 py-1 bg-surface/90 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-widest text-foreground shadow-sm">
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
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight leading-tight group-hover:text-primary transition-colors line-clamp-2 flex-1">
                    {product.name}
                  </h3>
                  {product.productCode && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(product.productCode);
                        toast.success("Product id copied successfully");
                      }}
                      className="size-10 rounded-xl bg-background-secondary text-foreground-muted hover:text-primary hover:bg-primary/10 transition-all flex items-center justify-center shrink-0 shadow-sm overflow-hidden active:scale-90"
                      title="Copy Product ID for AI"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        content_copy
                      </span>
                    </button>
                  )}
                </div>
                {product.productCode && (
                  <p className="text-[10px] font-black text-foreground-muted dark:text-foreground-muted/60 uppercase tracking-widest mt-1">
                    Ref: {product.productCode}
                  </p>
                )}
              </div>

              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-foreground-muted uppercase tracking-widest leading-none">
                    Unit
                  </p>
                  <p className="text-sm font-black text-foreground">
                    {product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-foreground-muted uppercase tracking-widest leading-none">
                    Min Order
                  </p>
                  <p className="text-sm font-black text-foreground">
                    {product.minOrderQuantity.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Price Details */}
              <div className="flex items-center justify-between border-t border-border-light pt-4">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-foreground-muted uppercase tracking-widest leading-none">
                    Unit Price
                  </p>
                  <p className="text-sm font-black text-foreground dark:text-emerald-500">
                    {product.pricePerUnitKobo
                      ? (Number(product.pricePerUnitKobo) / 100).toLocaleString(
                          "en-NG",
                          {
                            style: "currency",
                            currency: "NGN",
                          },
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => onRepost(product)}
                  className="py-3 bg-background-secondary text-foreground rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-background-secondary/80 transition-colors"
                >
                  Repost
                </button>
                <button
                  onClick={() => setDeletingId(product.id)}
                  className="py-3 border-2 border-border-light text-foreground-muted rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-red-100 dark:hover:border-red-500/20 hover:text-red-500 transition-colors"
                >
                  Delete
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
