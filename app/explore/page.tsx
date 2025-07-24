"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Compass, Play, Shuffle, Music, Loader2 } from "lucide-react"
import { StarRating } from "@/components/ui/star-rating"

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
    release_date: string
  }
  duration_ms: number
  preview_url: string | null
}

const MAIN_GENRES = [
  { id: "pop", name: "Pop", color: "bg-pink-600" },
  { id: "rock", name: "Rock", color: "bg-red-600" },
  { id: "hip-hop", name: "Hip Hop", color: "bg-purple-600" },
  { id: "electronic", name: "Electronic", color: "bg-blue-600" },
  { id: "jazz", name: "Jazz", color: "bg-yellow-600" },
  { id: "classical", name: "Classical", color: "bg-indigo-600" },
  { id: "country", name: "Country", color: "bg-green-600" },
  { id: "r&b", name: "R&B", color: "bg-orange-600" },
  { id: "indie", name: "Indie", color: "bg-teal-600" },
  { id: "latin", name: "Latin", color: "bg-rose-600" },
]

export default function ExplorePage() {
  const [genreData, setGenreData] = useState<Record<string, SpotifyTrack[]>>({})
  const [selectedGenre, setSelectedGenre] = useState("pop")
  const [randomTracks, setRandomTracks] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [genreLoading, setGenreLoading] = useState(false)

  useEffect(() => {
    fetchGenreData()
    fetchRandomTracks()
  }, [])

  const fetchGenreData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/spotify/genres-data")
      if (response.ok) {
        const data = await response.json()
        setGenreData(data.genres || {})
      }
    } catch (error) {
      console.error("Error fetching genre data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRandomTracks = async () => {
    try {
      const response = await fetch("/api/spotify/random-songs?limit=100")
      if (response.ok) {
        const data = await response.json()
        setRandomTracks(data.tracks || [])
      }
    } catch (error) {
      console.error("Error fetching random tracks:", error)
    }
  }

  const refreshGenre = async (genre: string) => {
    setGenreLoading(true)
    try {
      const response = await fetch(`/api/spotify/random-songs?genre=${genre}&limit=50`)
      if (response.ok) {
        const data = await response.json()
        setGenreData((prev) => ({
          ...prev,
          [genre]: data.tracks || [],
        }))
      }
    } catch (error) {
      console.error("Error refreshing genre:", error)
    } finally {
      setGenreLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="text-white text-lg">Loading music genres...</p>
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
              <Compass className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Explore Music</h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
              Discover new music by genre, explore curated collections, and find your next favorite song
            </p>
          </div>

          <Tabs defaultValue="genres" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800 rounded-2xl">
              <TabsTrigger value="genres" className="data-[state=active]:bg-red-600 rounded-xl">
                By Genre
              </TabsTrigger>
              <TabsTrigger value="discover" className="data-[state=active]:bg-red-600 rounded-xl">
                Random Discovery
              </TabsTrigger>
            </TabsList>

            {/* Genres Tab */}
            <TabsContent value="genres" className="space-y-8">
              {/* Genre Selection */}
              <div className="space-y-4">
                <h2 className="text-xl md:text-2xl font-semibold text-white">Choose a Genre</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
                  {MAIN_GENRES.map((genre) => (
                    <Button
                      key={genre.id}
                      variant={selectedGenre === genre.id ? "default" : "outline"}
                      onClick={() => setSelectedGenre(genre.id)}
                      className={`rounded-2xl h-auto p-4 flex flex-col items-center gap-2 ${
                        selectedGenre === genre.id
                          ? `${genre.color} hover:opacity-90`
                          : "border-gray-600 text-gray-300 bg-transparent hover:bg-gray-800"
                      }`}
                    >
                      <Music className="w-5 h-5" />
                      <span className="text-xs font-medium">{genre.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Genre Tracks */}
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-lg md:text-xl font-semibold text-white capitalize">
                    {MAIN_GENRES.find((g) => g.id === selectedGenre)?.name} Music
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => refreshGenre(selectedGenre)}
                      disabled={genreLoading}
                      className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800"
                    >
                      {genreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shuffle className="w-4 h-4" />}
                      Refresh
                    </Button>
                  </div>
                </div>

                {genreLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                    {(genreData[selectedGenre] || []).slice(0, 30).map((track) => (
                      <Card
                        key={track.id}
                        className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 group rounded-3xl backdrop-blur-sm"
                      >
                        <CardContent className="p-4 md:p-4">
                          <Link href={`/song/${track.id}`}>
                            <div className="relative aspect-square mb-3 md:mb-4 rounded-2xl overflow-hidden">
                              <Image
                                src={track.album.images[0]?.url || "/placeholder.svg?height=200&width=200"}
                                alt={track.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-full flex items-center justify-center">
                                  <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 md:space-y-2">
                              <h4 className="font-medium text-xs md:text-sm text-white line-clamp-2">{track.name}</h4>
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {track.artists.map((a) => a.name).join(", ")}
                              </p>
                            </div>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Show message if no tracks for genre */}
                {!genreLoading && (!genreData[selectedGenre] || genreData[selectedGenre].length === 0) && (
                  <div className="text-center py-12">
                    <Music className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">
                      No tracks found for this genre. Try refreshing or select another genre.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Random Discovery Tab */}
            <TabsContent value="discover" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg md:text-2xl font-semibold text-white">Random Discovery</h2>
                <Button
                  variant="outline"
                  onClick={fetchRandomTracks}
                  className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Shuffle All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {randomTracks.slice(0, 30).map((track, index) => (
                  <Card
                    key={track.id}
                    className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 group rounded-3xl backdrop-blur-sm"
                  >
                    <CardContent className="p-5">
                      <Link href={`/song/${track.id}`} className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                          <Image
                            src={track.album.images[0]?.url || "/placeholder.svg?height=64&width=64"}
                            alt={track.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors text-sm md:text-base">
                            {track.name}
                          </h3>
                          <p className="text-gray-400 truncate text-xs md:text-sm">
                            {track.artists.map((a) => a.name).join(", ")}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{track.album.name}</p>
                          <StarRating rating={3.5 + Math.random() * 1.5} readonly size="sm" />
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-white ml-0.5" />
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
