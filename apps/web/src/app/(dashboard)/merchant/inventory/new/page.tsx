'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { getMyProducts } from '@/lib/api/product.api';
import { adjustStock } from '@/lib/api/inventory.api';
import type { Product } from '@hardware-os/shared';

export default function NewInventoryItemPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedProductId = searchParams.get('productId') || '';

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [products, setProducts] = useState<Product[]>([]);

    const [productId, setProductId] = useState(preselectedProductId);
    const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
    const [quantity, setQuantity] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const data = (await getMyProducts()) as unknown as Product[];
                setProducts(data);
                if (preselectedProductId) setProductId(preselectedProductId);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to load products');
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [preselectedProductId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || !quantity) return;

        setIsSubmitting(true);
        setError('');

        try {
            const qty = parseInt(quantity, 10);
            const finalQuantity = adjustmentType === 'remove' ? -qty : qty;
            await adjustStock(productId, {
                quantity: finalQuantity,
                notes: notes || undefined,
            });
            router.push('/merchant/inventory');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to adjust stock');
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-10 py-4 animate-in fade-in duration-500">
                <Skeleton className="size-12 rounded-full" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-8">
                    <Skeleton className="h-12 w-full rounded-2xl" />
                    <Skeleton className="h-48 w-full rounded-2xl" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-6">
                <button onClick={() => router.back()} className="size-12 rounded-full border border-slate-100 dark:border-slate-800 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-navy-dark dark:text-white tracking-tight uppercase leading-none font-display">Adjust Stock</h1>
                    <p className="text-slate-500 font-bold text-sm tracking-wide mt-2">Add or remove stock for a product in your inventory</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-navy-dark/5 space-y-10">
                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
                            <p className="text-red-600 dark:text-red-400 text-sm font-bold">{error}</p>
                        </div>
                    )}

                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Product</label>
                            <select
                                required
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none appearance-none focus:border-navy-dark dark:focus:border-white transition-all"
                            >
                                <option value="">Choose a product...</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.categoryTag})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Adjustment Type</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('add')}
                                    className={`py-5 px-6 rounded-2xl border-2 text-sm font-black uppercase tracking-widest transition-all ${
                                        adjustmentType === 'add'
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'
                                            : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg align-middle mr-2">add_circle</span>
                                    Stock In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAdjustmentType('remove')}
                                    className={`py-5 px-6 rounded-2xl border-2 text-sm font-black uppercase tracking-widest transition-all ${
                                        adjustmentType === 'remove'
                                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                                            : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-lg align-middle mr-2">remove_circle</span>
                                    Stock Out
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl py-5 px-6 text-sm font-black text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all"
                                    placeholder="Enter quantity"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-32 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl py-5 px-6 text-sm font-bold text-navy-dark dark:text-white outline-none focus:border-navy-dark dark:focus:border-white transition-all resize-none"
                                placeholder="Batch numbers, supplier details, reason for adjustment..."
                            />
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting || !productId || !quantity}
                            className="px-12 py-5 bg-navy-dark text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-navy-dark/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-80 flex items-center gap-3"
                        >
                            {isSubmitting ? 'Processing...' : adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                            <span className="material-symbols-outlined text-lg">inventory</span>
                        </button>
                    </div>
                </form>

                <div className="mt-10 p-8 bg-amber-50/50 dark:bg-amber-900/10 rounded-[2.5rem] border border-dashed border-amber-200 dark:border-amber-900/30 flex items-start gap-6">
                    <span className="material-symbols-outlined text-amber-500 font-black">verified</span>
                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed uppercase tracking-tight">
                        By adding these items, you confirm they are physically in-stock and meet the <span className="text-navy-dark dark:text-white font-black">SON (Standards Organisation of Nigeria)</span> compliance for building hardware.
                    </p>
                </div>
            </div>
        </div>
    );
}
