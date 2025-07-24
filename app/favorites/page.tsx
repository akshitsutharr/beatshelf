"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Loader2, Play, Clock, Trash2 } from "lucide-react"
import { StarRating } from "@/components/ui/star-rating"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface FavoriteSong {
  id: string
  created_at: string
  songs: {
    id: string
    name: string
    artist_name: string
    album_name: string
    album_image_url?: string
    duration_ms?: number
    release_date?: string
  }
}

export default function FavoritesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [favorites, setFavorites] = useState<FavoriteSong[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin")
      return
    }
    fetchFavorites()
  }, [user])

  const fetchFavorites = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select(`
          id,
          created_at,
          songs!inner (
            id,
            name,
            artist_name,
            album_name,
            album_image_url,
            duration_ms,
            release_date
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Favorites fetch error:", error)
        throw error
      }

      console.log("Fetched favorites:", data)
      setFavorites(data || [])
    } catch (error) {
      console.error("Error fetching favorites:", error)
      toast({
        title: "Error",
        description: "Failed to load your favorites",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (favoriteId: string, songName: string) => {
    try {
      const { error } = await supabase.from("favorites").delete().eq("id", favoriteId)

      if (error) throw error

      setFavorites(favorites.filter((fav) => fav.id !== favoriteId))
      toast({
        title: "Removed from favorites",
        description: `"${songName}" has been removed from your favorites`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      })
    }
  }

  const formatDuration = (ms?: number) => {
    if (!ms) return "0:00"
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="text-white text-lg">Loading your favorites...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-8 w-8 text-red-600 fill-current" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Your Favorites</h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
              All the songs you've loved and saved for later
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="bg-red-600/20 text-red-400 rounded-full">
                {favorites.length} {favorites.length === 1 ? "Song" : "Songs"}
              </Badge>
            </div>
          </div>

          {/* Favorites List */}
          {favorites.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <Heart className="h-16 w-16 mx-auto mb-6 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">No favorites yet</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Start exploring music and add songs to your favorites by clicking the heart icon
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-red-600 hover:bg-red-700 rounded-xl" asChild>
                    <Link href="/search">Search Music</Link>
                  </Button>
                  <Button variant="outline" className="border-gray-600 text-gray-300 bg-transparent rounded-xl" asChild>
                    <Link href="/trending">Browse Trending</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Desktop View */}
              <div className="hidden md:block">
                {favorites.map((favorite, index) => (
                  <Card
                    key={favorite.id}
                    className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 rounded-2xl backdrop-blur-sm"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-xl">
                          <span className="text-lg font-bold text-gray-400 group-hover:text-red-600 transition-colors">
                            {index + 1}
                          </span>
                        </div>

                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                          <Image
                            src={
                              favorite.songs.album_image_url || "/placeholder.svg?height=64&width=64&query=album cover"
                            }
                            alt={favorite.songs.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/song/${favorite.songs.id}`}
                            className="block group-hover:text-red-400 transition-colors"
                          >
                            <h3 className="font-semibold text-white truncate">{favorite.songs.name}</h3>
                            <p className="text-gray-400 truncate">{favorite.songs.artist_name}</p>
                            <p className="text-sm text-gray-500 truncate">{favorite.songs.album_name}</p>
                          </Link>
                        </div>

                        <div className="flex items-center gap-4">
                          <StarRating rating={4.0 + Math.random() * 1} readonly size="sm" />

                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{formatDuration(favorite.songs.duration_ms)}</span>
                          </div>

                          <div className="text-sm text-gray-500">{formatTimeAgo(favorite.created_at)}</div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFavorite(favorite.id, favorite.songs.name)}
                            className="text-gray-500 hover:text-red-500 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Mobile View */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {favorites.map((favorite) => (
                  <Card
                    key={favorite.id}
                    className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 group rounded-3xl backdrop-blur-sm"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                          <Image
                            src={
                              favorite.songs.album_image_url || "/placeholder.svg?height=64&width=64&query=album cover"
                            }
                            alt={favorite.songs.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-white ml-0.5" />
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <Link href={`/song/${favorite.songs.id}`} className="block">
                            <h3 className="font-semibold text-white truncate text-sm">{favorite.songs.name}</h3>
                            <p className="text-gray-400 truncate text-xs">{favorite.songs.artist_name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <StarRating rating={4.0 + Math.random() * 1} readonly size="sm" />
                              <span className="text-xs text-gray-500">{formatTimeAgo(favorite.created_at)}</span>
                            </div>
                          </Link>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFavorite(favorite.id, favorite.songs.name)}
                          className="text-gray-500 hover:text-red-500 rounded-xl flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
