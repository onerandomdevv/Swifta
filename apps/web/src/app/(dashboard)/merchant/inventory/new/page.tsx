import React from "react";
import { AddProductWizard } from "@/components/merchant/inventory/AddProductWizard";

export default function NewProductPage() {
  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col relative">
      <AddProductWizard />
    </div>
  );
}
