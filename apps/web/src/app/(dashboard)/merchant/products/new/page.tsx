"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the registry with a signal to open the drawer
    router.replace("/merchant/products?action=list");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="size-12 border-4 border-slate-200 border-t-navy-dark rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Rerouting to Registry...</p>
      </div>
    </div>
  );
}
