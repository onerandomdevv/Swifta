import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKobo(kobo: number | bigint): string {
  const naira = Number(kobo) / 100;
  return `₦${naira.toLocaleString("en-NG", {
    maximumFractionDigits: 2,
  })}`;
}

export function optimizeCloudinaryUrl(url: string | null | undefined, width = 400): string | undefined {
  if (!url) return undefined;
  if (!url.includes("cloudinary.com")) return url;
  if (url.includes("/upload/q_auto")) return url; // Already optimized
  
  return url.replace("/image/upload/", `/image/upload/q_auto,f_auto,w_${width}/`);
}
