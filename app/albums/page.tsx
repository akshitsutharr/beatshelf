"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { MessageSquare, Star, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"

interface AlbumRelease {
  id: string
  name: string
  artists: Array<{ name: string }>
  images: Array<{ url: string }>
  release_date: string
  total_tracks?: number
}

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    id: string
    name: string
    images: Array<{ url: string }>
  }
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<AlbumRelease[]>([])
  const [tracks, setTracks] = useState<Array<{ track: SpotifyTrack }>>([])
  const [realReviews, setRealReviews] = useState<Array<{ song_id: string }>>([])
  const [realRatings, setRealRatings] = useState<Array<{ song_id: string, rating: number }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchAlbums(), fetchTracks(), fetchCommunityData()]).finally(() => setLoading(false))
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

  const albumReviewMomentum = useMemo(() => {
    return albums.map((album) => {
      const id = `album:${album.id}`
      const reviews = realReviews.filter(r => r.song_id === id).length
      const ratings = realRatings.filter(r => r.song_id === id)
      const avgRating = ratings.length > 0 ? Number((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1)) : 0
      return {
        ...album,
        avgRating,
        reviews,
      }
    })
  }, [albums, realReviews, realRatings])

  const trackReviewSuggestions = useMemo(() => {
    return tracks.slice(0, 16).map((item) => {
      const id = item.track.id
      const reviews = realReviews.filter(r => r.song_id === id).length
      return {
        id,
        title: item.track.name,
        artist: item.track.artists.map((a) => a.name).join(", "),
        albumId: item.track.album.id,
        albumName: item.track.album.name,
        image: item.track.album.images[0]?.url || "/placeholder.svg?height=200&width=200",
        reviewCount: reviews,
      }
    })
  }, [tracks, realReviews])

  return (
    <div className="min-h-screen bg-[#050608] text-white pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_88%_30%,rgba(244,63,94,0.18),transparent_35%)]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-7 md:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">Album Discovery</p>
              <h1 className="text-4xl md:text-5xl font-semibold mt-2 tracking-tight">Albums for Review</h1>
              <p className="text-white/65 mt-3 max-w-2xl">
                Explore trending albums, see community sentiment, and post album-level or track-level reviews.
              </p>
            </div>
            <Button className="rounded-2xl bg-white text-black hover:bg-white/90" asChild>
              <Link href="/write-review">Write a Review</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl md:text-3xl font-semibold">Trending Albums</h2>
            <Badge className="rounded-full bg-white/10 text-white border border-white/15">Community Rated</Badge>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-[360px] rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {albumReviewMomentum.slice(0, 12).map((album) => (
                <article key={album.id} className="rounded-3xl overflow-hidden border border-white/10 bg-white/[0.05] group hover:bg-white/[0.08] transition-colors">
                  <Link href={`/album/${album.id}`}>
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <Image src={album.images[0]?.url || "/placeholder.svg?height=600&width=480"} alt={album.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 p-4 w-full">
                        <h3 className="text-xl font-semibold line-clamp-1">{album.name}</h3>
                        <p className="text-sm text-white/70 line-clamp-1">{album.artists.map((a) => a.name).join(", ")}</p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          {album.avgRating > 0 ? (
                            <span className="inline-flex items-center gap-1 text-yellow-300"><Star className="w-4 h-4" /> {album.avgRating}</span>
                          ) : (
                            <span className="text-white/50 italic text-xs">Not yet rated</span>
                          )}
                          <span className="text-white/60">{album.reviews > 0 ? `${album.reviews} reviews` : "No reviews yet"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="p-4 pt-3 grid grid-cols-2 gap-2">
                    <Button className="rounded-xl bg-white text-black hover:bg-white/90" asChild>
                      <Link href={`/album/${album.id}`}>Album Review</Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl border-white/20 bg-transparent hover:bg-white/10" asChild>
                      <Link href={`/album/${album.id}`}><MessageSquare className="w-4 h-4 mr-1" />Tracks</Link>
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Track Review Opportunities</h2>
            <p className="text-sm text-white/60">Write individual track reviews from trending albums</p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
            {trackReviewSuggestions.map((track) => (
              <Link key={track.id} href={`/song/${track.id}`} className="rounded-2xl border border-white/10 bg-black/35 p-3 hover:bg-black/50 transition-colors">
                <div className="flex items-center gap-3">
                  <Image src={track.image} alt={track.title} width={56} height={56} className="rounded-xl object-cover" />
                  <div className="min-w-0">
                    <p className="font-medium line-clamp-1">{track.title}</p>
                    <p className="text-sm text-white/60 line-clamp-1">{track.artist}</p>
                    <p className="text-xs text-white/45">{track.reviewCount > 0 ? `${track.reviewCount} reviews` : "No reviews yet"}</p>

                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#142138]/80 to-[#261626]/80 p-6 md:p-8">
          <h3 className="text-2xl font-semibold">Community Feedback Snapshot</h3>
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-white/60 text-sm">Avg global rating</p>
              <p className="text-3xl font-semibold mt-1">{realRatings.length > 0 ? (realRatings.reduce((a, b) => a + b.rating, 0) / realRatings.length).toFixed(1) : "0.0"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-white/60 text-sm">Total discussions</p>
              <p className="text-3xl font-semibold mt-1">{realReviews.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <p className="text-white/60 text-sm">Active signals</p>
              <p className="text-3xl font-semibold mt-1 inline-flex items-center gap-2">{realReviews.length + realRatings.length} <Users className="w-5 h-5 text-sky-300" /></p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
