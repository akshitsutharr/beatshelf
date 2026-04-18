"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Compass, Filter, Loader2, MessageCircle, Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarRating } from "@/components/ui/star-rating"
import { supabase } from "@/lib/supabase"

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
}

const GENRES = ["pop", "rock", "hip-hop", "electronic", "jazz", "indie", "r&b", "latin"]
const MOODS = ["energetic", "chill", "melancholic", "romantic"]
const POPULARITY = ["rising", "mainstream", "deep cuts"]
const QUICK_SEARCHES = ["new releases", "viral songs", "indie gems", "late night pop"]

export default function ExplorePage() {
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [genre, setGenre] = useState("pop")
  const [mood, setMood] = useState("energetic")
  const [popularity, setPopularity] = useState("rising")
  const [visibleCount, setVisibleCount] = useState(18)
  const [sortMode, setSortMode] = useState<"reviews" | "rating">("reviews")
  const searchCacheRef = useRef<Map<string, SpotifyTrack[]>>(new Map())

  const [realReviews, setRealReviews] = useState<Array<{ song_id: string }>>([])
  const [realRatings, setRealRatings] = useState<Array<{ song_id: string, rating: number }>>([])

  useEffect(() => {
    fetchCommunityData()
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

  useEffect(() => {
    fetchGenreTracks(genre)
  }, [genre])

  const fetchGenreTracks = async (selectedGenre: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/spotify/random-songs?genre=${selectedGenre}&limit=70`)
      if (!response.ok) {
        setTracks([])
        return
      }
      const data = await response.json()
      setTracks(data.tracks || [])
      setVisibleCount(18)
    } catch (error) {
      console.error("Error fetching genre tracks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault()
    const query = searchQuery.trim().toLowerCase()
    if (!query) return

    const cached = searchCacheRef.current.get(query)
    if (cached) {
      setTracks(cached)
      setVisibleCount(18)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        setTracks([])
        return
      }
      const data = await response.json()
      const fromSearch: SpotifyTrack[] = (data?.tracks?.items || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        artists: item.artists || [],
        album: item.album,
      }))
      searchCacheRef.current.set(query, fromSearch)
      setTracks(fromSearch)
      setVisibleCount(18)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return tracks
      .filter((track) => {
        const haystack = `${track.name} ${track.artists.map((a) => a.name).join(" ")} ${track.album.name}`.toLowerCase()
        return !searchQuery || haystack.includes(searchQuery.toLowerCase())
      })
      .map((track) => {
        const id = track.id
        const reviews = realReviews.filter(r => r.song_id === id).length
        const ratings = realRatings.filter(r => r.song_id === id)
        const avgRating = ratings.length > 0 ? Number((ratings.reduce((s, r)=> s + r.rating, 0) / ratings.length).toFixed(1)) : 0
        return { ...track, syntheticRating: avgRating, reviews }
      })
      .sort((a, b) => (sortMode === "reviews" ? b.reviews - a.reviews : b.syntheticRating - a.syntheticRating))
  }, [tracks, searchQuery, sortMode, realReviews, realRatings])

  const visibleTracks = filtered.slice(0, visibleCount)

  const loadMore = () => {
    setLoadingMore(true)
    setTimeout(() => {
      setVisibleCount((prev) => prev + 12)
      setLoadingMore(false)
    }, 350)
  }

  const resetFilters = () => {
    setSearchQuery("")
    setGenre("pop")
    setMood("energetic")
    setPopularity("rising")
    setSortMode("reviews")
    fetchGenreTracks("pop")
  }

  return (
    <div className="page-shell relative min-h-screen bg-[#050608] text-white pb-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black" />
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5 sm:p-7 md:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">Discovery Engine</p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mt-2 tracking-tight">Explore Music by Taste</h1>
              <p className="text-white/65 mt-3 max-w-2xl">Discover tracks through genre, mood, and community review momentum.</p>
            </div>
            <Badge className="rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" /> Adaptive Discovery
            </Badge>
          </div>

          <form onSubmit={handleSearch} className="mt-6 grid md:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-white/50 absolute left-4 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search songs, artists, albums"
                className="pl-11 h-12 rounded-2xl border-white/20 bg-black/40 placeholder:text-white/45"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="h-12 rounded-2xl bg-white text-black hover:bg-white/90">Search</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="h-12 rounded-2xl border-white/20 bg-transparent hover:bg-white/10"
              >
                Clear
              </Button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_SEARCHES.map((term) => (
              <Button
                key={term}
                type="button"
                variant="outline"
                onClick={() => setSearchQuery(term)}
                className="rounded-full border-white/15 bg-black/30 hover:bg-white/10 h-8 px-3 text-xs"
              >
                {term}
              </Button>
            ))}
          </div>
        </section>

        <section className="sm:rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-2xl px-5 py-6 sm:p-8">

          {/* HEADER */}
          <div className="flex items-center gap-2 text-white/70 mb-6">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Filters</span>
          </div>

          {/* GENRE */}
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">Genre</p>

            <div className="flex flex-wrap gap-2">
              {["Pop","Rock","Hip-Hop","Electronic","Jazz","Indie","R&B","Latin"].map((g) => (
                <button
                  key={g}
                  className="px-4 py-2 rounded-xl text-sm text-white/60 border border-white/10 
                  bg-white/[0.02] hover:bg-white/[0.08] hover:text-white
                  transition-all duration-200
                  data-[active=true]:bg-white data-[active=true]:text-black data-[active=true]:border-white"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* MOOD */}
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">Mood</p>

            <div className="flex flex-wrap gap-2">
              {["Energetic","Chill","Melancholic","Romantic"].map((m) => (
                <button
                  key={m}
                  className="px-4 py-2 rounded-xl text-sm text-white/60 border border-white/10 
                  bg-white/[0.02] hover:bg-white/[0.08] hover:text-white
                  transition-all duration-200
                  data-[active=true]:bg-white data-[active=true]:text-black"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* POPULARITY */}
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mb-3">Popularity</p>

            <div className="flex flex-wrap gap-2">
              {["Rising","Mainstream","Deep Cuts"].map((p) => (
                <button
                  key={p}
                  className="px-4 py-2 rounded-xl text-sm text-white/60 border border-white/10 
                  bg-white/[0.02] hover:bg-white/[0.08] hover:text-white
                  transition-all duration-200
                  data-[active=true]:bg-white data-[active=true]:text-black
                  disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* SORT */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/40 mr-2">Sort</p>

            {["Most Reviewed","Highest Rated"].map((s) => (
              <button
                key={s}
                className="px-4 py-2 rounded-xl text-sm text-white/60 border border-white/10 
                bg-white/[0.02] hover:bg-white/[0.08] hover:text-white
                transition-all duration-200
                data-[active=true]:bg-white data-[active=true]:text-black"
              >
                {s}
              </button>
            ))}

            <button className="ml-auto px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white border border-white/10 hover:bg-white/10 transition">
              Reset
            </button>
          </div>

        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight inline-flex items-center gap-2">
              <Compass className="w-6 h-6 text-sky-300" /> Discovery Grid
            </h2>
            <p className="text-white/60 text-sm">{filtered.length} tracks matched</p>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={idx} className="h-[320px] rounded-3xl border border-white/10 bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visibleTracks.map((track) => (
                  <article key={track.id} className="group rounded-3xl overflow-hidden border border-white/10 bg-white/[0.05] hover:bg-white/[0.08] transition-colors">
                    <Link href={`/song/${track.id}`}>
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <Image
                          src={track.album.images[0]?.url || "/placeholder.svg?height=500&width=500"}
                          alt={track.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/55" />
                        <div className="absolute bottom-0 p-4 w-full">
                          <p className="text-lg sm:text-xl font-semibold line-clamp-1">{track.name}</p>
                          <p className="text-sm text-white/70 line-clamp-1">{track.artists.map((a) => a.name).join(", ")}</p>
                          <div className="flex items-center justify-between mt-3">
                            {track.syntheticRating > 0 ? (
                              <StarRating rating={track.syntheticRating} readonly size="sm" />
                            ) : (
                              <span className="text-white/50 italic text-xs">Not yet rated</span>
                            )}
                            <p className="text-xs text-white/65">{track.reviews > 0 ? `${track.reviews} reviews` : "No reviews"}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="p-4 pt-3 flex gap-2">
                      <Button className="flex-1 rounded-xl bg-white text-black hover:bg-white/90" asChild>
                        <Link href={`/song/${track.id}`}>Rate Track</Link>
                      </Button>
                      <Button variant="outline" className="rounded-xl border-white/25 bg-transparent hover:bg-white/10" asChild>
                        <Link href="/write-review"><MessageCircle className="w-4 h-4" /></Link>
                      </Button>
                    </div>
                  </article>
                ))}
              </div>

              {visibleCount < filtered.length && (
                <div className="flex justify-center pt-2">
                  <Button
                    onClick={loadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="rounded-2xl border-white/20 bg-transparent hover:bg-white/10 min-w-40"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
