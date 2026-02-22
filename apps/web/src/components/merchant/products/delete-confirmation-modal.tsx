import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Delisting">
      <div className="p-6 space-y-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delist this product? It will no longer be
          visible to buyers in the catalogue. This action cannot be undone.
        </p>

        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-slate-300 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-red-500/20 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Delisting..." : "Yes, Delist Product"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
