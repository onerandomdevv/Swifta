'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getMyProducts } from '@/lib/api/product.api';
import { getStock } from '@/lib/api/inventory.api';
import type { Product } from '@hardware-os/shared';

interface InventoryItem {
  product: Product;
  stock: number;
  status: 'HEALTHY' | 'LOW' | 'OUT_OF_STOCK';
}

export default function MerchantInventoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const products = (await getMyProducts()) as unknown as Product[];
        const items: InventoryItem[] = await Promise.all(
          products.map(async (product) => {
            try {
              const stockData = (await getStock(product.id)) as unknown as { productId: string; stock: number };
              const stock = stockData.stock ?? 0;
              const status: InventoryItem['status'] =
                stock === 0 ? 'OUT_OF_STOCK' : stock < 50 ? 'LOW' : 'HEALTHY';
              return { product, stock, status };
            } catch {
              return { product, stock: 0, status: 'OUT_OF_STOCK' as const };
            }
          })
        );
        setInventory(items);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load inventory');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalStock = inventory.reduce((sum, i) => sum + i.stock, 0);
  const lowStockCount = inventory.filter((i) => i.status === 'LOW').length;
  const outOfStockCount = inventory.filter((i) => i.status === 'OUT_OF_STOCK').length;

  if (loading) {
    return (
      <div className="space-y-10 py-4 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-12 w-48 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
        </div>

        <div className="space-y-6">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-40 w-full rounded-[2.5rem]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Inventory Vault</h1>
          <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Oversee your physical stock levels and warehouse distribution</p>
        </div>
        <button
          onClick={() => router.push('/merchant/inventory/new')}
          className="flex items-center gap-2 px-8 py-3 bg-navy-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-navy-dark/20 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">inventory_2</span>
          Update Stock Levels
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:border-blue-200 transition-colors">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Stock Volume</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-navy-dark dark:text-white tracking-tighter">{totalStock.toLocaleString()}</h3>
            <span className="material-symbols-outlined text-blue-500 opacity-20 text-4xl group-hover:scale-125 transition-transform font-black">box</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:border-amber-200 transition-colors">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Low Stock Alerts</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-amber-500 tracking-tighter">{lowStockCount}</h3>
            <span className="material-symbols-outlined text-amber-500 opacity-20 text-4xl group-hover:scale-125 transition-transform font-black">warning</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm group hover:border-red-200 transition-colors">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Out of Stock</p>
          <div className="flex items-end justify-between">
            <h3 className="text-3xl font-black text-red-500 tracking-tighter">{outOfStockCount}</h3>
            <span className="material-symbols-outlined text-red-500 opacity-20 text-4xl group-hover:scale-125 transition-transform font-black">block</span>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      {inventory.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-slate-200 mb-4">inventory_2</span>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No products yet. Add products first to track inventory.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {inventory.map((item) => (
            <div key={item.product.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:shadow-xl transition-all duration-300 group">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-8">
                  <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border border-slate-100 dark:border-slate-700 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-slate-300">pallet</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-navy-dark dark:text-white uppercase tracking-tight">{item.product.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.product.categoryTag} • {item.product.unit}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:flex items-center gap-10">
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Stock</p>
                    <p className={`text-xl font-black tracking-tighter ${item.status === 'OUT_OF_STOCK' ? 'text-red-500' : item.status === 'LOW' ? 'text-amber-500' : 'text-navy-dark dark:text-white'}`}>
                      {item.stock.toLocaleString()} Units
                    </p>
                  </div>
                  <div className="text-center md:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-sm font-black uppercase tracking-widest ${item.status === 'OUT_OF_STOCK' ? 'text-red-500' : item.status === 'LOW' ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {item.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 col-span-2 lg:col-span-1 justify-center">
                    <button
                      onClick={() => router.push(`/merchant/inventory/new?productId=${item.product.id}`)}
                      className="size-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 flex items-center justify-center text-navy-dark dark:text-white hover:border-navy-dark active:scale-95 transition-all shadow-sm"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
