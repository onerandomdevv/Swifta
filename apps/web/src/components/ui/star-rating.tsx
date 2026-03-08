import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  onRatingChange,
  readOnly = false,
  size = "md",
  className,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
  };

  const stars = Array.from({ length: maxRating }, (_, idx) => idx + 1);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stars.map((star) => {
        const isActive = (hoverRating || rating) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHoverRating(star)}
            onMouseLeave={() => !readOnly && setHoverRating(0)}
            onClick={() => !readOnly && onRatingChange?.(star)}
            aria-label={`${star} star${star > 1 ? "s" : ""}${!readOnly ? ` - click to rate ${star}` : ""}`}
            className={cn(
              "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-lg",
              sizes[size],
              isActive
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200 dark:text-slate-700",
              !readOnly && "hover:scale-125 active:scale-95 cursor-pointer",
            )}
          >
            <span className="material-symbols-outlined font-variation-fill">
              star
            </span>
          </button>
        );
      })}
    </div>
  );
};
