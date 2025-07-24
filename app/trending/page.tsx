"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Loader2, Play, Clock, Shuffle } from "lucide-react"
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
  external_urls: { spotify: string }
}

export default function TrendingPage() {
  const [chartTracks, setChartTracks] = useState<Array<{ track: SpotifyTrack }>>([])
  const [newReleases, setNewReleases] = useState<SpotifyTrack[]>([])
  const [viralHits, setViralHits] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("charts")

  useEffect(() => {
    fetchAllTrendingData()
  }, [])

  const fetchAllTrendingData = async () => {
    setLoading(true)
    try {
      // Fetch chart data
      await fetchChartData()
      // Fetch new releases
      await fetchNewReleases()
      // Fetch viral hits
      await fetchViralHits()
    } catch (error) {
      console.error("Failed to fetch trending data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch("/api/spotify/charts")
      if (response.ok) {
        const data = await response.json()
        if (data.tracks && data.tracks.length > 0) {
          setChartTracks(data.tracks)
        } else {
          // Fallback to random popular songs
          const fallbackResponse = await fetch("/api/spotify/random-songs?limit=50")
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            const formattedTracks = fallbackData.tracks.map((track: SpotifyTrack) => ({ track }))
            setChartTracks(formattedTracks)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    }
  }

  const fetchNewReleases = async () => {
    try {
      // Try featured API first
      const featuredResponse = await fetch("/api/spotify/featured")
      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json()
        if (featuredData.newReleases?.items?.length > 0) {
          // Convert albums to tracks format
          const albumTracks: SpotifyTrack[] = featuredData.newReleases.items.map((album: any) => ({
            id: album.id,
            name: album.name,
            artists: album.artists,
            album: {
              name: album.name,
              images: album.images,
              release_date: album.release_date,
            },
            duration_ms: 180000, // Default 3 minutes
            preview_url: null,
            external_urls: { spotify: album.external_urls?.spotify || "" },
          }))
          setNewReleases(albumTracks)
          return
        }
      }

      // Fallback: Search for recent music
      const currentYear = new Date().getFullYear()
      const searchResponse = await fetch(`/api/spotify/random-songs?genre=pop&limit=30`)
      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        setNewReleases(searchData.tracks || [])
      }
    } catch (error) {
      console.error("Error fetching new releases:", error)
      // Final fallback
      const fallbackResponse = await fetch("/api/spotify/random-songs?limit=20")
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        setNewReleases(fallbackData.tracks || [])
      }
    }
  }

  const fetchViralHits = async () => {
    try {
      // Fetch viral/trending songs using multiple genres
      const viralGenres = ["pop", "hip-hop", "electronic", "rock"]
      const allViralTracks: SpotifyTrack[] = []

      for (const genre of viralGenres) {
        try {
          const response = await fetch(`/api/spotify/random-songs?genre=${genre}&limit=15`)
          if (response.ok) {
            const data = await response.json()
            allViralTracks.push(...(data.tracks || []))
          }
        } catch (error) {
          console.warn(`Failed to fetch viral hits for ${genre}`)
        }
      }

      // Remove duplicates and shuffle
      const uniqueViralTracks = allViralTracks
        .filter((track, index, self) => track && track.id && index === self.findIndex((t) => t && t.id === track.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 30)

      setViralHits(uniqueViralTracks)
    } catch (error) {
      console.error("Error fetching viral hits:", error)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const refreshData = async (type: string) => {
    switch (type) {
      case "charts":
        await fetchChartData()
        break
      case "new-releases":
        await fetchNewReleases()
        break
      case "viral":
        await fetchViralHits()
        break
      default:
        await fetchAllTrendingData()
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Trending Now</h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
              Discover the hottest tracks and latest releases from around the world
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-800 rounded-2xl">
              <TabsTrigger value="charts" className="data-[state=active]:bg-red-600 rounded-xl">
                Top Charts
              </TabsTrigger>
              <TabsTrigger value="new-releases" className="data-[state=active]:bg-red-600 rounded-xl">
                New Releases
              </TabsTrigger>
              <TabsTrigger value="viral" className="data-[state=active]:bg-red-600 rounded-xl">
                Viral Hits
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-semibold text-white">Global Top 50</h2>
                <Button
                  variant="outline"
                  onClick={() => refreshData("charts")}
                  className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
              ) : (
                <div className="space-y-3">
                  {chartTracks.slice(0, 50).map((item, index) => (
                    <Card
                      key={item.track.id}
                      className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 rounded-2xl backdrop-blur-sm"
                    >
                      <CardContent className="p-4">
                        <Link href={`/song/${item.track.id}`} className="flex items-center gap-4 group">
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-xl">
                            <span className="text-xl font-bold text-gray-400 group-hover:text-red-600 transition-colors">
                              {index + 1}
                            </span>
                          </div>
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0">
                            <Image
                              src={item.track.album.images[0]?.url || "/placeholder.svg?height=64&width=64"}
                              alt={item.track.name}
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
                            <h3 className="font-semibold text-white truncate group-hover:text-red-400 transition-colors">
                              {item.track.name}
                            </h3>
                            <p className="text-gray-400 truncate">{item.track.artists.map((a) => a.name).join(", ")}</p>
                            <p className="text-sm text-gray-500 truncate">{item.track.album.name}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <StarRating rating={4.0 + Math.random() * 1} readonly size="sm" />
                            <div className="flex items-center gap-1 text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm">{formatDuration(item.track.duration_ms)}</span>
                            </div>
                            {index < 3 && (
                              <Badge className="bg-red-600 text-white rounded-full px-3">
                                {index === 0 ? "🔥 Hot" : index === 1 ? "⭐ Rising" : "🚀 Viral"}
                              </Badge>
                            )}
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new-releases" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-semibold text-white">Latest Releases</h2>
                <Button
                  variant="outline"
                  onClick={() => refreshData("new-releases")}
                  className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
                  {newReleases.map((track) => (
                    <Card
                      key={track.id}
                      className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 group rounded-3xl backdrop-blur-sm"
                    >
                      <CardContent className="p-3 md:p-4">
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
                              <Button
                                size="icon"
                                className="w-8 h-8 md:w-10 md:h-10 bg-red-600 hover:bg-red-700 rounded-full"
                              >
                                <Play className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1 md:space-y-2">
                            <h3 className="font-medium text-xs md:text-sm text-white line-clamp-2">{track.name}</h3>
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {track.artists.map((a) => a.name).join(", ")}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary" className="bg-red-600/20 text-red-400 text-xs rounded-full">
                                New
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="viral" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl md:text-2xl font-semibold text-white">Viral Hits</h2>
                <Button
                  variant="outline"
                  onClick={() => refreshData("viral")}
                  className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {viralHits.map((track, index) => (
                    <Card
                      key={track.id}
                      className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 group rounded-3xl backdrop-blur-sm"
                    >
                      <CardContent className="p-4 md:p-6">
                        <Link href={`/song/${track.id}`} className="flex items-center gap-4">
                          <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden flex-shrink-0">
                            <Image
                              src={track.album.images[0]?.url || "/placeholder.svg?height=80&width=80"}
                              alt={track.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate text-sm md:text-base">{track.name}</h3>
                            <p className="text-gray-400 truncate text-xs md:text-sm">
                              {track.artists.map((a) => a.name).join(", ")}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <StarRating rating={3.8 + Math.random() * 1.2} readonly size="sm" />
                              <Badge className="bg-red-600/20 text-red-400 rounded-full text-xs">
                                {index < 10 ? "🔥 Viral" : "📈 Trending"}
                              </Badge>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
