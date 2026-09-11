"use client";

import * as React from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  ariaLabel?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-8 w-8",
};

export function StarRating({ value, onChange, size = "md", className, ariaLabel }: StarRatingProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);
  const interactive = typeof onChange === "function";
  const display = hovered ?? value;

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={ariaLabel ?? `Rated ${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(display);
        const starEl = (
          <Star
            aria-hidden
            className={cn(
              sizeClasses[size],
              filled ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/40",
              interactive && "cursor-pointer transition-transform hover:scale-110"
            )}
          />
        );
        if (!interactive) {
          return <span key={star}>{starEl}</span>;
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            className="rounded-sm p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(null)}
          >
            {starEl}
          </button>
        );
      })}
    </div>
  );
}
