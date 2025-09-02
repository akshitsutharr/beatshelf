"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, TrendingUp, Music, Clock, Users, Star, Sparkles, Heart } from "lucide-react"
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

interface FeaturedData {
  featured: {
    items: Array<{
      id: string
      name: string
      description: string
      images: Array<{ url: string }>
    }>
  }
  newReleases: {
    items: Array<{
      id: string
      name: string
      artists: Array<{ name: string }>
      images: Array<{ url: string }>
      release_date: string
    }>
  }
  topTracks: Array<{
    track: SpotifyTrack
  }>
}

export default function HomePage() {
  const [featuredData, setFeaturedData] = useState<FeaturedData | null>(null)
  const [chartTracks, setChartTracks] = useState<Array<{ track: SpotifyTrack }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedData()
    fetchChartData()
  }, [])

  const fetchFeaturedData = async () => {
    try {
      const response = await fetch("/api/spotify/featured")
      if (response.ok) {
        const data = await response.json()
        setFeaturedData(data)
      }
    } catch (error) {
      console.error("Error fetching featured data:", error)
    }
  }

  const fetchChartData = async () => {
    try {
      const response = await fetch("/api/spotify/charts")
      if (response.ok) {
        const data = await response.json()
        setChartTracks(data.tracks || [])
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-48 sm:h-64 lg:h-80 bg-gray-800 rounded-3xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 sm:h-48 bg-gray-800 rounded-3xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-black" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="flex items-center justify-center gap-3 mb-6 sm:mb-8">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-600 rounded-2xl flex items-center justify-center">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white">BeatShelf</h1>
            </div>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed px-4">
              Discover, rate, and review the world's music. Join the community.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 px-4">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-6 sm:px-8 py-3 text-base sm:text-lg"
              >
                <Link href="/explore" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  Explore Music
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent rounded-2xl px-6 sm:px-8 py-3 text-base sm:text-lg"
              >
                <Link href="/search">Search Songs</Link>
              </Button>
            </div>

            {/* Creator Credit - Enhanced Design */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600/20 to-pink-600/20 rounded-full border border-red-600/30">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-sm bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent font-medium">
                  Crafted by Akshit Suthar
                </span>
            </div>

          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12">
        {/* Featured New Releases */}
        {featuredData?.newReleases?.items && featuredData.newReleases.items.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">New Releases</h2>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white rounded-xl self-start sm:self-auto"
                asChild
              >
                <Link href="/trending">See All</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {featuredData.newReleases.items.slice(0, 12).map((album) => (
                <Card
                  key={album.id}
                  className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 group rounded-2xl sm:rounded-3xl backdrop-blur-sm"
                >
                  <CardContent className="p-2 sm:p-3">
                    <div className="relative aspect-square mb-2 sm:mb-3 rounded-xl sm:rounded-2xl overflow-hidden">
                      <Image
                        src={album.images[0]?.url || "/placeholder.svg?height=200&width=200"}
                        alt={album.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 hover:bg-red-700 rounded-full">
                          <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-medium text-xs sm:text-sm text-white line-clamp-1">{album.name}</h3>
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {album.artists.map((a) => a.name).join(", ")}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(album.release_date).getFullYear()}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Top Charts */}
        {chartTracks.length > 0 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                Top Charts
              </h2>
              <Button
                variant="ghost"
                className="text-gray-400 hover:text-white rounded-xl self-start sm:self-auto"
                asChild
              >
                <Link href="/trending">View All</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 List */}
              <Card className="bg-gray-900/50 border-gray-800 rounded-2xl sm:rounded-3xl backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Global Top 10</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {chartTracks.slice(0, 10).map((item, index) => (
                      <Link
                        key={item.track.id}
                        href={`/song/${item.track.id}`}
                        className="flex items-center gap-2 sm:gap-3 p-1 sm:p-2 rounded-xl sm:rounded-2xl hover:bg-gray-800/50 transition-colors group"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
                          <span className="text-xs sm:text-lg font-bold text-gray-400 group-hover:text-red-600">
                            {index + 1}
                          </span>
                        </div>
                        <Image
                          src={item.track.album.images[0]?.url || "/placeholder.svg?height=40&width=40"}
                          alt={item.track.name}
                          width={24}
                          height={24}
                          className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-white truncate">
                            {item.track.name.length > 20 ? item.track.name.substring(0, 20) + "..." : item.track.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {item.track.artists.map((a) => a.name).join(", ").length > 15 ? 
                             item.track.artists.map((a) => a.name).join(", ").substring(0, 15) + "..." : 
                             item.track.artists.map((a) => a.name).join(", ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <StarRating rating={4.2 + Math.random() * 0.8} readonly size="sm" />
                          <span className="text-xs text-gray-500 hidden sm:inline">
                            {formatDuration(item.track.duration_ms)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Featured Albums Grid */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-semibold text-white">Trending Albums</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {chartTracks.slice(0, 4).map((item) => (
                    <Card
                      key={item.track.album.name + item.track.artists[0].name}
                      className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 group rounded-2xl sm:rounded-3xl backdrop-blur-sm"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="relative aspect-square mb-2 sm:mb-3 rounded-xl sm:rounded-2xl overflow-hidden">
                          <Image
                            src={item.track.album.images[0]?.url || "/placeholder.svg?height=150&width=150"}
                            alt={item.track.album.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              className="w-6 h-6 sm:w-8 sm:h-8 bg-red-600 hover:bg-red-700 rounded-full"
                            >
                              <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-xs sm:text-sm text-white line-clamp-1">
                            {item.track.album.name.length > 15 ? item.track.album.name.substring(0, 15) + "..." : item.track.album.name}
                          </h4>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {item.track.artists.map((a) => a.name).join(", ").length > 12 ? 
                             item.track.artists.map((a) => a.name).join(", ").substring(0, 12) + "..." : 
                             item.track.artists.map((a) => a.name).join(", ")}
                          </p>
                          <div className="flex items-center justify-between">
                            <StarRating rating={4.0 + Math.random() * 1} readonly size="sm" />
                            <Badge variant="secondary" className="bg-red-600/20 text-red-400 text-xs rounded-full px-1">
                              Hot
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { title: "Songs", value: "50M+", icon: Music, desc: "In our database" },
            { title: "Users", value: "2.1M+", icon: Users, desc: "Active monthly" },
            { title: "Reviews", value: "15M+", icon: Star, desc: "Community reviews" },
            { title: "Hours", value: "500K+", icon: Clock, desc: "Music streamed" },
          ].map((stat) => (
            <Card
              key={stat.title}
              className="bg-gray-900/50 border-gray-800 rounded-2xl sm:rounded-3xl backdrop-blur-sm"
            >
              <CardContent className="p-3 sm:p-4 text-center">
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 mx-auto mb-2" />
                <div className="text-lg sm:text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-gray-400">{stat.title}</div>
                <div className="text-xs text-gray-500">{stat.desc}</div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* CTA Section */}
        <section className="text-center py-8 sm:py-12">
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Start Your Musical Journey</h2>
            <p className="text-gray-400 max-w-2xl mx-auto px-4">
              Join millions of music lovers discovering, rating, and sharing their favorite tracks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Button
                size="lg"
                className="bg-red-600 hover:bg-red-700 text-white rounded-2xl px-6 sm:px-8 py-3"
                asChild
              >
                <Link href="/auth/signup">Sign Up Free</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent rounded-2xl px-6 sm:px-8 py-3"
                asChild
              >
                <Link href="/search">Explore Music</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer with Creator Credit */}
      <footer className="border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white">BeatShelf</span>
            </div>

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-400">© 2024 BeatShelf. All rights reserved.</p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-gray-500">Crafted with</span>
                <span className="text-red-500">♥</span>
                <span className="text-gray-500">by</span>
                <span className="font-semibold bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                  Akshit Suthar
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-gray-400">
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
