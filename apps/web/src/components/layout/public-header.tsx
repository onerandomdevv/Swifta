"use client";

import * as React from "react";
import { Search, Camera, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/use-debounce";

export function PublicHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isSearchExpanded, setIsSearchExpanded] = React.useState(false);
  
  // Initialize search query from URL
  const [searchQuery, setSearchQuery] = React.useState(searchParams.get("search") || "");
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Sync state with URL when search param changes externally (e.g. back button)
  React.useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Handle debounced search navigation
  React.useEffect(() => {
    const currentSearch = searchParams.get("search") || "";
    
    // Only navigate if the query has actually changed and isn't just the initial state
    if (debouncedQuery !== currentSearch) {
      const params = new URLSearchParams(searchParams.toString());
      if (debouncedQuery) {
        params.set("search", debouncedQuery);
      } else {
        params.delete("search");
      }

      const newUrl = `/explore?${params.toString()}`;
      
      if (pathname === "/explore") {
        router.replace(newUrl, { scroll: false });
      } else if (debouncedQuery) {
        // Only jump to explore if there is a query
        router.push(newUrl);
      }
    }
  }, [debouncedQuery, pathname, router, searchParams]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const params = new URLSearchParams(searchParams.toString());
      if (searchQuery) {
        params.set("search", searchQuery);
      } else {
        params.delete("search");
      }
      router.push(`/explore?${params.toString()}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 md:h-20">
        {/* Left: Logo */}
        <div className={cn("flex items-center", isSearchExpanded ? "hidden md:flex" : "flex")}>
          <Logo size="md" />
        </div>

        {/* Center: Search Bar (Desktop) */}
        <div className={cn(
          "flex-1 items-center justify-center transition-all duration-300 ease-in-out",
          isSearchExpanded ? "flex" : "hidden md:flex"
        )}>
          <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products, merchants, categories..."
              className="h-11 w-full rounded-full bg-accent pr-12 pl-12 text-base ring-offset-background placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-primary"
              aria-label="Search by image"
            >
              <Camera className="h-5 w-5" />
            </button>
            
            {/* Mobile Close Search */}
            <button
              type="button"
              onClick={() => setIsSearchExpanded(false)}
              className="absolute -right-10 top-1/2 -translate-y-1/2 md:hidden"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Right: Auth Buttons / Mobile Search Toggle */}
        <div className={cn("flex items-center gap-2", isSearchExpanded ? "hidden md:flex" : "flex")}>
          {/* Mobile Search Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSearchExpanded(true)}
          >
            <Search className="h-6 w-6" />
          </Button>

          <div className="hidden items-center gap-3 sm:flex">
            <Button variant="outline" asChild className="border-primary text-primary hover:bg-primary/5">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="bg-[#00C853] hover:bg-[#00B248]">
              <Link href="/register">Register</Link>
            </Button>
          </div>

          {/* Fallback Mobile Login */}
          <Button variant="outline" size="sm" asChild className="border-primary text-primary sm:hidden">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
