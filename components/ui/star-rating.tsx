"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  readonly?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

export function StarRating({ rating, onRatingChange, readonly = false, size = "md", className }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0)
    }
  }

  const displayRating = hoverRating || rating

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map((value) => {
        const isHalf = value % 1 !== 0
        const isFilled = displayRating >= value
        const isPartiallyFilled = !isHalf && displayRating >= value - 0.5 && displayRating < value

        return (
          <button
            key={value}
            type="button"
            className={cn(
              "relative transition-all duration-200",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default",
            )}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            disabled={readonly}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-all duration-300",
                isFilled
                  ? "fill-red-500 text-red-500 drop-shadow-sm"
                  : isPartiallyFilled
                    ? "fill-red-300 text-red-500"
                    : "fill-transparent text-gray-600",
              )}
            />
            {isHalf && (
              <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star
                  className={cn(
                    sizeClasses[size],
                    "transition-all duration-300",
                    displayRating >= value
                      ? "fill-red-500 text-red-500 drop-shadow-sm"
                      : "fill-transparent text-gray-600",
                  )}
                />
              </div>
            )}
          </button>
        )
      })}
      <span className="ml-2 text-sm font-medium text-gray-300">{displayRating.toFixed(1)}/5</span>
    </div>
  )
}
