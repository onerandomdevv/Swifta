"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getWholesaleCatalogue,
  createWholesaleOrder,
} from "@/lib/api/supplier.api";
import { formatKobo } from "@hardware-os/shared";
import { useToast } from "@/providers/toast-provider";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

export default function WholesaleCataloguePage() {
  const toast = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [address, setAddress] = useState("");

  const {
    data: catalogue,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["wholesale", "catalogue"],
    queryFn: getWholesaleCatalogue,
  });

  const orderMutation = useMutation({
    mutationFn: createWholesaleOrder,
    onSuccess: (data: any) => {
      toast.success("Order created! Redirecting to payment...");
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
      setSelectedProduct(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create order");
    },
  });

  const handleOpenOrder = (product: any) => {
    setSelectedProduct(product);
    setQuantity(product.minOrderQty);
  };

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    orderMutation.mutate({
      productId: selectedProduct.id,
      quantity: Number(quantity),
      deliveryAddress: address,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Manufacturer Directory
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Buy stock directly from manufacturers and large distributors at
          wholesale prices.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : !catalogue || catalogue.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">
            factory
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            No active suppliers
          </h3>
          <p className="text-slate-500 dark:text-slate-400">
            Manufacturer stock will appear here once verified suppliers list
            their products.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogue.map((item: any) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="h-48 bg-slate-50 dark:bg-slate-800 relative flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">
                  inventory
                </span>
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className="px-2 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-md">
                    Wholesale
                  </span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-1">
                    Sold by {item.supplier?.companyName || "Manufacturer"}
                  </p>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Starting at
                    </label>
                    <p className="text-xl font-black text-primary tabular-nums">
                      {formatKobo(item.wholesalePriceKobo)}
                    </p>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Min. Order
                    </label>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {item.minOrderQty} {item.unit}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenOrder(item)}
                    className="flex-1 py-3 bg-primary text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-lg">
                      shopping_cart
                    </span>
                    Order Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Place Wholesale Order"
      >
        <form onSubmit={handleOrder} className="p-8 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
            <div className="size-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800">
              <span className="material-symbols-outlined text-primary">
                inventory
              </span>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white">
                {selectedProduct?.name}
              </h4>
              <p className="text-xs text-slate-500">
                {selectedProduct?.supplier?.companyName}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-lg font-black text-primary">
                {selectedProduct &&
                  formatKobo(selectedProduct.wholesalePriceKobo)}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                per {selectedProduct?.unit}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Order Quantity
              </label>
              <input
                type="number"
                min={selectedProduct?.minOrderQty}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                required
              />
              <p className="text-[10px] text-slate-400 font-medium ml-1">
                Minimum: {selectedProduct?.minOrderQty} {selectedProduct?.unit}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                Total Estimate
              </label>
              <div className="h-14 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 flex items-center">
                <p className="text-lg font-black text-navy-dark dark:text-white tabular-nums">
                  {selectedProduct &&
                    formatKobo(
                      BigInt(selectedProduct.wholesalePriceKobo) *
                        BigInt(quantity || 0),
                    )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
              Delivery Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 font-medium text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
              placeholder="Enter the full delivery address for this stock..."
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full h-14"
            isLoading={orderMutation.isPending}
            disabled={
              !quantity || quantity < (selectedProduct?.minOrderQty || 0)
            }
          >
            Confirm & Proceed to Payment
          </Button>

          <p className="text-center text-[10px] text-slate-400 font-medium px-4">
            By clicking confirm, you agree to the Hardware OS B2B Escrow terms.
            Payment will be held until you confirm receipt of stock.
          </p>
        </form>
      </Modal>
    </div>
  );
}
