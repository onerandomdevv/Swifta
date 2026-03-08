"use client";

import React, { useState, useEffect } from "react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/api/category.api";
import { type Category } from "@hardware-os/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/providers/toast-provider";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<Partial<Category> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingCategory(cat);
    setIsEditing(true);
  };

  const handleAddNew = (parentId?: string) => {
    setEditingCategory({
      name: "",
      parentId: parentId || undefined,
      isActive: true,
      sortOrder: 0,
      icon: "",
    });
    setIsEditing(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    try {
      setIsSubmitting(true);
      if (isEditing && editingCategory.id) {
        await updateCategory(editingCategory.id, editingCategory);
        toast.success("Category updated successfully");
      } else {
        await createCategory(editingCategory as any);
        toast.success("Category created successfully");
      }
      setError(null); // Reset error on success
      setIsEditing(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Operation failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this category?")) return;
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (err: any) {
      setError(err?.message || "Failed to delete category");
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-navy-dark dark:text-white uppercase tracking-tight">
            Category Management
          </h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">
            Define and organize the marketplace hierarchy.
          </p>
        </div>
        <button
          onClick={() => handleAddNew()}
          className="px-6 py-3 bg-navy-dark text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:-translate-y-1 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Parent Category
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wide flex gap-3 items-center">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Category Name
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Slug
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {categories.map((cat) => (
              <React.Fragment key={cat.id}>
                {/* Parent Row */}
                <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-navy-dark dark:text-primary">
                        folder
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-400 font-bold">
                      {cat.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded ${cat.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-slate-400">
                      <button
                        onClick={() => handleAddNew(cat.id)}
                        title="Add Sub-category"
                        className="hover:text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          add_box
                        </span>
                      </button>
                      <button
                        onClick={() => handleEdit(cat)}
                        title="Edit"
                        className="hover:text-navy-dark dark:hover:text-white transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          edit
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        title="Deactivate"
                        className="hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          delete
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
                {/* Sub-category Rows */}
                {cat.children?.map((sub) => (
                  <tr
                    key={sub.id}
                    className="bg-slate-50/20 dark:bg-slate-800/10 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-l-4 border-slate-200 dark:border-slate-700"
                  >
                    <td className="px-10 py-3">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-slate-400 text-sm">
                          subdirectory_arrow_right
                        </span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          {sub.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <code className="text-[10px] text-slate-400 font-bold">
                        {sub.slug}
                      </code>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded ${sub.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}
                      >
                        {sub.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2 text-slate-400 scale-90">
                        <button
                          onClick={() => handleEdit(sub)}
                          title="Edit"
                          className="hover:text-navy-dark dark:hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id)}
                          title="Deactivate"
                          className="hover:text-red-500 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-20 text-center">
                  <div className="text-slate-300 space-y-2">
                    <span className="material-symbols-outlined text-5xl">
                      inventory_2
                    </span>
                    <p className="text-sm font-bold uppercase tracking-widest">
                      No Categories Defined
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
            <h2 className="text-xl font-black text-navy-dark dark:text-white uppercase tracking-tight flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">
                category
              </span>
              {editingCategory?.id ? "Edit Category" : "Create New Category"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Category Name
                </label>
                <input
                  required
                  value={editingCategory?.name}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-6 py-4 text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl focus:border-primary outline-none transition-all placeholder:text-slate-300 dark:text-white"
                  placeholder="e.g. Electronics"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={editingCategory?.parentId || ""}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      parentId: e.target.value || undefined,
                    })
                  }
                  className="w-full px-6 py-4 text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl focus:border-primary outline-none transition-all text-slate-700 appearance-none bg-transparent"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((c) => c.id !== editingCategory?.id && !c.parentId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">
                    Icon Name (Material Sym.)
                  </label>
                  <input
                    value={editingCategory?.icon || ""}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        icon: e.target.value,
                      })
                    }
                    className="w-full px-6 py-4 text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl focus:border-primary outline-none transition-all text-center placeholder:text-slate-300 dark:text-white"
                    placeholder="e.g. construction"
                  />
                </div>
                <div className="space-y-2 text-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={editingCategory?.sortOrder || 0}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        sortOrder: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-6 py-4 text-sm font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-2xl focus:border-primary outline-none transition-all text-center dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={editingCategory?.isActive}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      isActive: e.target.checked,
                    })
                  }
                  className="size-5 rounded border-2 border-slate-200 text-primary focus:ring-primary appearance-none checked:bg-primary checked:border-primary transition-all relative after:content-[''] after:absolute after:hidden after:checked:block after:left-1.5 after:top-0.5 after:w-1.5 after:h-2.5 after:border-white after:border-r-2 after:border-b-2 after:rotate-45"
                />
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-navy-dark transition-colors">
                  Category Active & Visible
                </span>
              </label>

              <div className="pt-4 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-6 py-4 border border-slate-200 dark:border-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-navy-dark text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-navy-dark/20 hover:-translate-y-1 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
