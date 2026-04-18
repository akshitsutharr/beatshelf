"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, MessageCircle, Star, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
    release_date?: string
  }
}

interface AlbumRelease {
  id: string
  name: string
  artists: Array<{ name: string }>
  images: Array<{ url: string }>
  release_date: string
}

export default function TrendingPage() {
  const [tracks, setTracks] = useState<Array<{ track: SpotifyTrack }>>([])
  const [albums, setAlbums] = useState<AlbumRelease[]>([])
  const [realReviews, setRealReviews] = useState<Array<{ song_id: string }>>([])
  const [realRatings, setRealRatings] = useState<Array<{ song_id: string, rating: number }>>([])
  const [windowFilter, setWindowFilter] = useState("weekly")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchTracks(), fetchAlbums(), fetchCommunityData()]).finally(() => setLoading(false))
  }, [])

  const fetchCommunityData = async () => {
    try {
      const [{ data: reviewsData }, { data: ratingsData }] = await Promise.all([
        supabase.from("reviews").select("song_id"),
        supabase.from("ratings").select("song_id, rating")
      ])
      if (reviewsData) setRealReviews(reviewsData)
      if (ratingsData) setRealRatings(ratingsData)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/spotify/charts")
      if (!res.ok) return
      const data = await res.json()
      setTracks(data?.tracks || [])
    } catch (error) {
      console.error("Failed to fetch tracks:", error)
    }
  }

  const fetchAlbums = async () => {
    try {
      const res = await fetch("/api/spotify/featured")
      if (!res.ok) return
      const data = await res.json()
      setAlbums(data?.newReleases?.items || [])
    } catch (error) {
      console.error("Failed to fetch albums:", error)
    }
  }

  const rankedSongs = useMemo(() => {
    const songReviews = new Map<string, number>()
    const songRatings = new Map<string, { sum: number, count: number }>()

    realReviews.forEach(r => {
      if (r.song_id) songReviews.set(r.song_id, (songReviews.get(r.song_id) || 0) + 1)
    })
    realRatings.forEach(r => {
      if (r.song_id && r.rating) {
        const existing = songRatings.get(r.song_id) || { sum: 0, count: 0 }
        songRatings.set(r.song_id, { sum: existing.sum + r.rating, count: existing.count + 1 })
      }
    })

    return tracks.slice(0, 30).map((item, index) => {
      const id = item.track.id
      const reviews = songReviews.get(id) || 0
      const ratingData = songRatings.get(id)
      const score = ratingData ? Number((ratingData.sum / ratingData.count).toFixed(1)) : 0
      const trend = index < 8 ? "up" : index < 16 ? "hold" : "new"

      return {
        id,
        name: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(", "),
        image: item.track.album.images[0]?.url || "/placeholder.svg?height=200&width=200",
        score,
        reviews,
        trend,
      }
    }).sort((a,b) => (b.score * b.reviews) - (a.score * a.reviews))
  }, [tracks, realReviews, realRatings])

  const rankedArtists = useMemo(() => {
    const artistScores = new Map<string, { name: string; image: string; reviews: number; scoreSum: number; scoreCount: number }>()

    tracks.slice(0, 45).forEach((item) => {
      const artistName = item.track.artists[0]?.name
      if (!artistName) return

      const id = item.track.id
      const reviewCount = realReviews.filter(r => r.song_id === id).length
      const ratings = realRatings.filter(r => r.song_id === id)

      const prev = artistScores.get(artistName)
      artistScores.set(artistName, {
        name: artistName,
        image: item.track.album.images[0]?.url || "/placeholder.svg?height=320&width=320",
        reviews: (prev?.reviews || 0) + reviewCount,
        scoreSum: (prev?.scoreSum || 0) + ratings.reduce((sum, r) => sum + r.rating, 0),
        scoreCount: (prev?.scoreCount || 0) + ratings.length,
      })
    })

    return Array.from(artistScores.values())
      .map(artist => ({
        ...artist,
        points: Math.round(artist.reviews * 10 + (artist.scoreCount > 0 ? (artist.scoreSum / artist.scoreCount) * 20 : 0))
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 20)
      .map((item, index) => ({ ...item, rank: index + 1 }))
  }, [tracks, realReviews, realRatings])

  const rankedAlbums = useMemo(() => {
    return albums.slice(0, 20).map((album, index) => {
      // Mock album ID for relation since it uses 'album:' prefix normally in this app
      const id = `album:${album.id}`
      const reviews = realReviews.filter(r => r.song_id === id).length
      const ratings = realRatings.filter(r => r.song_id === id)
      const score = ratings.length > 0 ? (ratings.reduce((s, r)=> s + r.rating,0) / ratings.length).toFixed(1) : 0

      return {
        id: album.id,
        name: album.name,
        artist: album.artists.map((a) => a.name).join(", "),
        image: album.images[0]?.url || "/placeholder.svg?height=320&width=320",
        score,
        reviews,
        rank: index + 1,
      }
    })
  }, [albums, realReviews, realRatings])

  return (
    <div className="min-h-screen bg-[#050608] text-white pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_12%_5%,rgba(56,189,248,0.2),transparent_34%),radial-gradient(circle_at_90%_28%,rgba(244,63,94,0.16),transparent_34%)]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-7 md:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">Curated Leaderboard</p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mt-2">Trending on Beatshelf</h1>
              <p className="text-white/65 mt-3 max-w-2xl">
                Rankings are based on ratings quality and review activity, not play count.
              </p>
            </div>
            <Badge className="bg-red-500/15 text-red-300 border border-red-500/30 px-4 py-2 rounded-full">
              <Flame className="w-4 h-4 mr-2" /> Fresh Momentum
            </Badge>
          </div>
          <Tabs value={windowFilter} onValueChange={setWindowFilter} className="mt-6">
            <TabsList className="rounded-2xl bg-black/45 border border-white/10 p-1">
              <TabsTrigger value="daily" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">Weekly</TabsTrigger>
              <TabsTrigger value="all-time" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-black">All-Time</TabsTrigger>
            </TabsList>
          </Tabs>
        </section>

        <section className="grid xl:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 md:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-semibold">Top Songs</h2>
              <Button variant="outline" className="rounded-xl border-white/20 bg-transparent hover:bg-white/10" asChild>
                <Link href="/reviews">Open Reviews</Link>
              </Button>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={windowFilter} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-2">
                  {rankedSongs.map((song, index) => (
                    <Link
                      href={`/song/${song.id}`}
                      key={song.id}
                      className="grid grid-cols-[48px_56px_1fr_auto] md:grid-cols-[58px_70px_1fr_auto] items-center gap-3 rounded-2xl p-2.5 border border-transparent hover:border-white/15 hover:bg-white/[0.04] transition-colors"
                    >
                      <div className="text-center">
                        <p className="font-semibold text-lg text-white/80">{index + 1}</p>
                        <p className="text-[10px] uppercase text-white/40 tracking-wide">{song.trend}</p>
                      </div>
                      <Image src={song.image} alt={song.name} width={70} height={70} className="rounded-xl object-cover" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{song.name}</p>
                        <p className="text-sm text-white/60 truncate">{song.artist}</p>
                        <p className="text-xs text-white/45 mt-1">{song.reviews > 0 ? `${song.reviews} active reviews` : "No reviews yet"}</p>
                      </div>
                      <div className="text-right">
                        {song.score > 0 ? (
                          <>
                            <p className="text-sm text-yellow-300 inline-flex items-center justify-end gap-1"><Star className="w-4 h-4" /> {song.score.toFixed(1)}</p>
                            <p className="text-xs text-white/45">review score</p>
                          </>
                        ) : (
                          <div className="flex items-center h-full">
                            <span className="text-[11px] text-white/40 italic">Not yet rated</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h3 className="text-xl font-semibold mb-4">Trending Artists</h3>
              <div className="space-y-2">
                {rankedArtists.slice(0, 8).map((artist) => (
                  <div key={artist.name} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/[0.05] transition-colors">
                    <p className="w-5 text-sm text-white/60">{artist.rank}</p>
                    <Image src={artist.image} alt={artist.name} width={46} height={46} className="rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{artist.name}</p>
                      <p className="text-xs text-white/50">{artist.reviews > 0 ? `${artist.reviews} review mentions` : "No reviews yet"}</p>
                    </div>
                    <p className="text-sm text-sky-300">{artist.points > 0 ? artist.points : "-"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-5">
              <h3 className="text-xl font-semibold mb-4">Top Albums</h3>
              <div className="space-y-2">
                {rankedAlbums.slice(0, 8).map((album) => (
                  <Link key={album.id} href={`/album/${album.id}`} className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/[0.05] transition-colors">
                    <p className="w-5 text-sm text-white/60">{album.rank}</p>
                    <Image src={album.image} alt={album.name} width={46} height={46} className="rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{album.name}</p>
                      <p className="text-xs text-white/50 truncate">{album.artist}</p>
                    </div>
                    {Number(album.score) > 0 ? (
                      <p className="text-sm text-yellow-300">{album.score}</p>
                    ) : (
                      <p className="text-[11px] text-white/40 italic">Not yet rated</p>
                    )}
                  </Link>
                ))}
              </div>
              <Button className="w-full mt-4 rounded-xl bg-white text-black hover:bg-white/90" asChild>
                <Link href="/albums"><MessageCircle className="w-4 h-4 mr-2" />Review Albums</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#131a2a]/80 to-[#1c1320]/80 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-semibold">How leaderboard scoring works</h3>
              <p className="text-white/65 mt-2">Weighted by average rating quality, review depth, and fresh community engagement.</p>
            </div>
            <Button variant="outline" className="rounded-xl border-white/25 bg-transparent hover:bg-white/10" asChild>
              <Link href="/reviews"><TrendingUp className="w-4 h-4 mr-2" />Join Discussion</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
