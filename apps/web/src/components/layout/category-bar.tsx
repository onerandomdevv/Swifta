"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CATEGORIES = [
  { name: "All", slug: "all" },
  { name: "Electronics", slug: "electronics" },
  { name: "Fashion", slug: "fashion" },
  { name: "Home & Kitchen", slug: "home-kitchen" },
  { name: "Health & Beauty", slug: "health-beauty" },
  { name: "Food & Groceries", slug: "food-groceries" },
  { name: "Phones & Gadgets", slug: "phones-gadgets" },
  { name: "Sports & Fitness", slug: "sports-fitness" },
  { name: "Baby & Kids", slug: "baby-kids" },
  { name: "Other", slug: "other" },
];

export function CategoryBar() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  return (
    <div className="sticky top-[64px] z-40 w-full border-b bg-background md:top-[80px]">
      <div className="container px-4">
        <div className="scrollbar-hide flex h-14 items-center gap-2 overflow-x-auto py-2">
          {CATEGORIES.map((category) => {
            const isActive = activeCategory === category.slug;
            
            // Create new params based on current ones
            const params = new URLSearchParams(searchParams.toString());
            if (category.slug === "all") {
              params.delete("category");
            } else {
              params.set("category", category.slug);
            }
            
            const href = `/explore${params.toString() ? `?${params.toString()}` : ""}`;
            
            return (
              <Link
                key={category.slug}
                href={href}
                className={cn(
                  "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-accent text-muted-foreground hover:bg-accent/80 hover:text-foreground"
                )}
              >
                {category.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
