'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProduct } from '@/lib/api/product.api';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    unit: 'bag',
    categoryTag: 'Building Materials',
    minOrderQuantity: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createProduct({
        name: formData.name,
        description: formData.description || undefined,
        unit: formData.unit,
        categoryTag: formData.categoryTag,
        minOrderQuantity: formData.minOrderQuantity,
      });
      router.push('/merchant/products');
    } catch (err: any) {
      setError(err?.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2">
        <button
          onClick={() => router.back()}
          className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-navy-dark transition-colors mb-4"
        >
          &larr; Back to Catalog
        </button>
        <h1 className="text-3xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
          List New Product
        </h1>
        <p className="text-slate-500 font-bold text-sm">
          Add a new hardware product to your marketplace catalog.
        </p>
      </div>

      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex gap-4">
          <span className="material-symbols-outlined text-red-500">error</span>
          <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Product Name
          </label>
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white"
            placeholder="e.g. Elephant Cement (50kg)"
          />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all placeholder:text-slate-300 dark:text-white h-32 resize-none"
            placeholder="Describe the product specifications, quality, origin..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Unit of Measure
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
            >
              <option value="bag">Bag</option>
              <option value="ton">Ton</option>
              <option value="piece">Piece</option>
              <option value="bundle">Bundle</option>
              <option value="roll">Roll</option>
              <option value="length">Length</option>
              <option value="kg">Kilogram</option>
              <option value="sqm">Square Meter</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Category
            </label>
            <select
              value={formData.categoryTag}
              onChange={(e) => setFormData({ ...formData, categoryTag: e.target.value })}
              className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all text-slate-400 appearance-none bg-transparent"
            >
              <option>Building Materials</option>
              <option>Metal & Steel</option>
              <option>Power Tools</option>
              <option>Heavy Machinery</option>
              <option>Safety Gear</option>
              <option>Plumbing</option>
              <option>Electrical</option>
              <option>Painting</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
            Minimum Order Quantity
          </label>
          <input
            type="number"
            min={1}
            required
            value={formData.minOrderQuantity}
            onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) || 1 })}
            className="w-full px-8 py-5 text-sm font-bold border-2 border-slate-50 dark:border-slate-800 dark:bg-slate-950 rounded-[1.5rem] focus:border-navy-dark outline-none transition-all dark:text-white"
          />
        </div>

        <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-5 bg-navy-dark text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-navy-dark/30 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
          >
            {loading ? 'Creating...' : 'Create Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
