"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function WhatsAppFab() {
  const whatsappNumber = "+2348012345678"; // Replace with actual business number
  const message = "Hello Twizrr, I'd like to make an inquiry.";
  const whatsappUrl = `https://wa.me/${whatsappNumber.replace("+", "")}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
      {/* Pulse Animation Layers */}
      <div className="absolute h-14 w-14 animate-ping rounded-full bg-[#25D366] opacity-20"></div>
      <div className="absolute h-12 w-12 animate-pulse rounded-full bg-[#25D366] opacity-40"></div>
      
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 active:scale-95",
          "hover:shadow-[0_0_20px_rgba(37,211,102,0.6)]"
        )}
        aria-label="Contact us on WhatsApp"
      >
        <svg
          viewBox="0 0 24 24"
          width="32"
          height="32"
          stroke="currentColor"
          strokeWidth="0"
          fill="currentColor"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884h.004c2.641 0 5.123 1.028 6.987 2.893s2.893 4.347 2.893 6.988c-.002 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .015 5.398 0 12.037c0 2.125.553 4.199 1.601 6.04L0 24l6.105-1.602a11.83 11.83 0 005.937 1.598h.005c6.637 0 12.035-5.399 12.036-12.038 0-3.217-1.252-6.241-3.526-8.515z" />
        </svg>
      </a>
      
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 hidden lg:block">
        <div className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background opacity-0 shadow-xl transition-opacity hover:opacity-100 group-hover:block">
          Need help? Chat with us
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-8 border-transparent border-t-foreground"></div>
        </div>
      </div>
    </div>
  );
}
