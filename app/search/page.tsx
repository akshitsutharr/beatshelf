"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SongCard } from "@/components/song-card"
import { Search, Loader2 } from "lucide-react"
import { formatSpotifyTrackForDB } from "@/lib/spotify"

interface AlbumResult {
  id: string
  name: string
  artists: Array<{ id: string; name: string }>
  images: Array<{ url: string }>
  release_date: string
  total_tracks: number
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""

  const [query, setQuery] = useState(initialQuery)
  const [songResults, setSongResults] = useState<any[]>([])
  const [albumResults, setAlbumResults] = useState<AlbumResult[]>([])
  const [artistResults, setArtistResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(!!initialQuery)

  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery)
    }
  }, [initialQuery])

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      const formattedTracks = data.tracks?.items ? data.tracks.items.map(formatSpotifyTrackForDB) : []
      const albums = data.albums?.items || []
      const artists = data.artists?.items || []

      setSongResults(formattedTracks)
      setAlbumResults(albums)
      setArtistResults(artists)
    } catch (error) {
      console.error("Search failed:", error)
      setSongResults([])
      setAlbumResults([])
      setArtistResults([])
    } finally {
      setLoading(false)
      setHasSearched(true)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(query)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Search Music</h1>
          <p className="text-muted-foreground">Discover songs, artists, and albums from Spotify's vast catalog</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for songs, artists, albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {hasSearched && !loading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {songResults.length + albumResults.length + artistResults.length > 0
                  ? `Found ${songResults.length + albumResults.length + artistResults.length} results`
                  : "No results found"}
              </h2>
            </div>

            {artistResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Artists</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {artistResults.map((artist) => (
                    <Link href={`/artist/${artist.id}`} key={artist.id} className="flex flex-col items-center gap-3 group cursor-pointer">
                      <div className="relative w-full aspect-square rounded-full overflow-hidden border border-white/10 bg-white/5 group-hover:border-white/30 transition-colors">
                        <Image
                          src={artist.images?.[0]?.url || "/placeholder.svg?height=200&width=200"}
                          alt={artist.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="text-center w-full group-hover:text-white transition-colors">
                        <p className="font-medium text-sm line-clamp-1">{artist.name}</p>
                        <p className="text-xs text-white/50 capitalize mt-1 line-clamp-1">
                          {artist.genres?.[0] || 'Artist'}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {songResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Songs</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {songResults.map((song) => (
                    <SongCard key={song.id} song={song} showRating={false} />
                  ))}
                </div>
              </div>
            )}

            {albumResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Albums</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {albumResults.map((album) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.id}`}
                      className="rounded-xl overflow-hidden border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={album.images?.[0]?.url || "/placeholder.svg?height=320&width=320"}
                          alt={album.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="font-medium text-sm line-clamp-1">{album.name}</p>
                        <p className="text-xs text-white/60 line-clamp-1 mt-1">
                          {album.artists?.map((artist) => artist.name).join(", ")}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {songResults.length === 0 && albumResults.length === 0 && artistResults.length === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                <p className="text-muted-foreground col-span-full">Try another search term.</p>
              </div>
            )}
          </div>
        )}

        {!hasSearched && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enter a search term to discover music</p>
          </div>
        )}
      </div>
    </div>
  )
}
