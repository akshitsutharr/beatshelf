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
  forceShowStars?: boolean
}

export function StarRating({ rating, onRatingChange, readonly = false, size = "md", className, forceShowStars = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)

  const sizeClasses = {
    sm: "w-3 h-3 sm:w-4 sm:h-4",
    md: "w-4 h-4 sm:w-5 sm:h-5",
    lg: "w-5 h-5 sm:w-6 sm:h-6",
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

  const displayRating = Math.max(0, Math.min(5, hoverRating || rating || 0))

  return (
    <div className={cn("flex items-center gap-0.5 sm:gap-1", className)}>
      {!forceShowStars && !onRatingChange && (
        <div className="sm:hidden">
          <span className="text-xs font-medium text-gray-300">{displayRating.toFixed(1)}/5</span>
        </div>
      )}
      
      <div className={cn(
        "flex items-center gap-1",
        !forceShowStars && !onRatingChange ? "hidden sm:flex" : "flex"
      )}>
        {[1, 2, 3, 4, 5].map((value) => {
          const fillPercentage = Math.max(0, Math.min(1, displayRating - (value - 1))) * 100
          const isFilled = fillPercentage === 100
          const isPartiallyFilled = fillPercentage > 0 && fillPercentage < 100

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
                  isFilled ? "fill-red-500 text-red-500 drop-shadow-sm" : "fill-transparent text-gray-600",
                )}
              />
              {isPartiallyFilled && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercentage}%` }}>
                  <Star
                    className={cn(
                      sizeClasses[size],
                      "transition-all duration-300",
                      "fill-red-500 text-red-500 drop-shadow-sm",
                    )}
                  />
                </div>
              )}
            </button>
          )
        })}
        <span className="ml-2 text-sm font-medium text-gray-300">{displayRating.toFixed(1)}/5</span>
      </div>
    </div>
  )
}
