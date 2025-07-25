"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { cn } from "@/lib/utils"

interface SongCardProps {
  song: {
    id: string
    name: string
    artist_name: string
    album_name: string
    album_image_url?: string | null
    preview_url?: string | null
    avg_rating?: number
    total_ratings?: number
  }
  showRating?: boolean
  className?: string
}

export function SongCard({ song, showRating = true, className }: SongCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorited(!isFavorited)
    // TODO: Implement favorite functionality
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden rounded-lg shadow-md transition-transform hover:scale-105 hover:shadow-xl",
        className,
      )}
    >
      <Link href={`/song/${song.id}`}>
        <CardContent className="p-0">
          <div className="relative aspect-square">
            <Image
              src={song.album_image_url || "/placeholder.svg?height=300&width=300&query=music album cover"}
              alt={`${song.album_name} cover`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

            {/* Add button overlay */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full bg-white/90 hover:bg-white text-black shadow-md"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  // TODO: Implement add functionality
                  alert("Add to playlist functionality not implemented yet.")
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Favorite button */}
            <Button
              size="icon"
              variant="ghost"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/40"
              onClick={handleFavorite}
            >
              <Heart className={cn("h-4 w-4", isFavorited ? "fill-red-500 text-red-500" : "text-white")} />
            </Button>
          </div>

          <div className="p-4 space-y-2">
            <div>
              <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                {song.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{song.artist_name}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">{song.album_name}</p>
            </div>

            {showRating && song.avg_rating !== undefined && (
              <div className="flex items-center justify-between">
                <StarRating rating={song.avg_rating} readonly size="sm" />
                {song.total_ratings && song.total_ratings > 0 && (
                  <span className="text-xs text-muted-foreground">({song.total_ratings})</span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
