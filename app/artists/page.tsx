"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Loader2, Mic2, Sparkles, TrendingUp } from "lucide-react"

interface Artist {
  id: string
  name: string
  images: Array<{ url: string }>
  genres: string[]
  popularity: number
  followers?: { total: number }
}

interface TrendingArtist {
  artistName: string
  averageRating: number
  reviewCount: number
  trendScore: number
}

function normalizeArtistName(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim()
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [trendingByReviews, setTrendingByReviews] = useState<TrendingArtist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [artistsRes, trendingRes] = await Promise.all([
          fetch("/api/spotify/artists?limit=40", { cache: "no-store" }),
          fetch("/api/artists/trending", { cache: "no-store" }),
        ])

        const artistsPayload = await artistsRes.json()
        const trendingPayload = await trendingRes.json()

        setArtists(Array.isArray(artistsPayload.items) ? artistsPayload.items : [])
        setTrendingByReviews(Array.isArray(trendingPayload.items) ? trendingPayload.items : [])
      } catch (error) {
        console.error("Failed to load artists page:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const trendingMap = useMemo(() => {
    const map = new Map<string, TrendingArtist>()
    for (const item of trendingByReviews) {
      map.set(normalizeArtistName(item.artistName), item)
    }
    return map
  }, [trendingByReviews])

  const rankedArtists = useMemo(() => {
    return [...artists].sort((a, b) => {
      const aTrend = trendingMap.get(normalizeArtistName(a.name))
      const bTrend = trendingMap.get(normalizeArtistName(b.name))

      if (aTrend && bTrend) return bTrend.trendScore - aTrend.trendScore
      if (aTrend) return -1
      if (bTrend) return 1
      return b.popularity - a.popularity
    })
  }, [artists, trendingMap])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(249,115,22,0.18),transparent_35%),radial-gradient(circle_at_88%_22%,rgba(56,189,248,0.15),transparent_33%)]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-7 md:p-9">
          <p className="text-xs uppercase tracking-[0.2em] text-white/50">Discover</p>
          <h1 className="text-4xl md:text-5xl font-semibold mt-2 tracking-tight">Artists</h1>
          <p className="text-white/65 mt-3 max-w-3xl">
            Explore artist pages with top songs, latest albums, genres, and community momentum. Artists with stronger review scores rise to the top.
          </p>
        </section>

        {rankedArtists.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-10 text-center text-white/70">
            No artist data found right now.
          </div>
        ) : (
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {rankedArtists.map((artist) => {
              const trend = trendingMap.get(normalizeArtistName(artist.name))

              return (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="group rounded-3xl overflow-hidden border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                >
                  <div className="relative aspect-square">
                    <Image
                      src={artist.images?.[0]?.url || "/placeholder.svg?height=500&width=500"}
                      alt={artist.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {trend ? (
                        <Badge className="rounded-full bg-orange-500/30 text-orange-200 border-orange-400/40">
                          <TrendingUp className="w-3 h-3 mr-1" /> Trending
                        </Badge>
                      ) : (
                        <Badge className="rounded-full bg-white/20 text-white border-white/20">
                          <Sparkles className="w-3 h-3 mr-1" /> Popular
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h2 className="font-semibold line-clamp-1">{artist.name}</h2>
                    <p className="text-xs text-white/65 line-clamp-1">{artist.genres?.slice(0, 2).join(" • ") || "Artist"}</p>
                    <div className="flex items-center justify-between text-xs text-white/55">
                      <span className="inline-flex items-center gap-1"><Mic2 className="w-3 h-3" /> {artist.followers?.total?.toLocaleString() || "-"}</span>
                      {trend ? (
                        <span>{trend.averageRating.toFixed(1)} avg · {trend.reviewCount} reviews</span>
                      ) : (
                        <span>Popularity {artist.popularity}</span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </section>
        )}
      </div>
    </div>
  )
}
