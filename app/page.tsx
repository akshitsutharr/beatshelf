"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight, Disc3, MessageCircle, Mic2, Star, TrendingUp, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { renderReviewContent } from "@/components/ui/rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { supabase } from "@/lib/supabase"

interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ id?: string; name: string }>
  album: {
    name: string
    images: Array<{ url: string }>
  }
}

interface NewReleaseAlbum {
  id: string
  name: string
  artists: Array<{ name: string }>
  images: Array<{ url: string }>
  release_date: string
}

interface RealReview {
  id: string
  content: string
  created_at: string
  song_id?: string
  profiles?: {
    username: string
    avatar_url: string | null
  }
  songs?: {
    id?: string
    name: string
    album_name?: string
    artist_name: string
    album_image_url: string | null
  }
  ratings?: {
    rating: number
  }
}

function ScrollSection({ title, subtitle, href, children }: { title: string; subtitle: string; href: string; children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      // Allow browser to handle shift+scroll naturally
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      
      const { scrollLeft, scrollWidth, clientWidth } = el
      const maxScroll = scrollWidth - clientWidth
      const atStart = scrollLeft <= 0 && e.deltaY < 0
      const atEnd = scrollLeft >= maxScroll && e.deltaY > 0
      
      if (atStart || atEnd) return

      e.preventDefault()
      el.scrollBy({ left: e.deltaY * 0.8, behavior: "auto" })
    }
    
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [])

  return (
    <section className="space-y-4 max-w-[100vw] overflow-hidden">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="text-white/55 text-sm mt-1">{subtitle}</p>
        </div>
        <Link href={href} className="text-sm text-white/70 hover:text-white inline-flex items-center">
          See all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="relative group">
        <div 
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-2 snap-x snap-mandatory rounded-2xl touch-pan-x"
        >
          {children}
        </div>
      </div>
    </section>
  )
}

function SkeletonCard() {
  return <div className="min-w-[280px] h-[360px] rounded-3xl bg-white/5 animate-pulse border border-white/10 snap-start" />
}

export default function HomePage() {
  const [newReleases, setNewReleases] = useState<NewReleaseAlbum[]>([])
  const [chartTracks, setChartTracks] = useState<Array<{ track: SpotifyTrack }>>([])
  const [realReviews, setRealReviews] = useState<RealReview[]>([])
  const [artistImages, setArtistImages] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchSpotifyData(), fetchCommunityReviews()]).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const loadArtistImages = async () => {
      const artistIds = Array.from(
        new Set(
          chartTracks
            .map((item) => item.track.artists[0]?.id)
            .filter((id): id is string => Boolean(id))
            .slice(0, 24),
        ),
      )

      if (artistIds.length === 0) {
        setArtistImages({})
        return
      }

      try {
        const params = new URLSearchParams({ ids: artistIds.join(",") })
        const response = await fetch(`/api/spotify/artists?${params.toString()}`, { cache: "no-store" })
        if (!response.ok) return

        const payload = await response.json()
        const imageMap: Record<string, string> = {}

        if (Array.isArray(payload.items)) {
          payload.items.forEach((artist: any) => {
            if (artist?.id && artist?.images?.[0]?.url) {
              imageMap[artist.id] = artist.images[0].url
            }
          })
        }

        setArtistImages(imageMap)
      } catch (error) {
        console.error("Error fetching artist images:", error)
      }
    }

    loadArtistImages()
  }, [chartTracks])

  const fetchSpotifyData = async () => {
    try {
      const [featuredRes, chartsRes] = await Promise.all([fetch("/api/spotify/featured"), fetch("/api/spotify/charts")])

      if (featuredRes.ok) {
        const featuredData = await featuredRes.json()
        setNewReleases(featuredData?.newReleases?.items || [])
      }

      if (chartsRes.ok) {
        const chartsData = await chartsRes.json()
        setChartTracks(chartsData?.tracks || [])
      }
    } catch (error) {
      console.error("Error fetching Spotify data:", error)
    }
  }

  const fetchCommunityReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          id,
          content,
          created_at,
          song_id,
          user_id,
          profiles:user_id (username, avatar_url),
          songs:song_id (id, name, album_name, artist_name, album_image_url)
        `)
        .order("created_at", { ascending: false })
        .limit(18)

      if (error) throw error

      if (data) {
        const formatted: RealReview[] = await Promise.all(
          data.map(async (review: any) => {
            let ratingValue = 0
            try {
              const { data: routeRating } = await supabase
                .from("ratings")
                .select("rating")
                .eq("user_id", review.user_id)
                .eq("song_id", review.song_id)
                .maybeSingle()
              if (routeRating) ratingValue = routeRating.rating
            } catch {
              ratingValue = 0
            }

            return {
              id: review.id,
              content: review.content,
              created_at: review.created_at,
              song_id: review.song_id,
              profiles: Array.isArray(review.profiles) ? review.profiles[0] : review.profiles,
              songs: Array.isArray(review.songs) ? review.songs[0] : review.songs,
              ratings: { rating: ratingValue },
            }
          })
        )
        setRealReviews(formatted)
      }
    } catch (error) {
      console.error("Error fetching community reviews:", error)
    }
  }

  const trendingArtists = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image: string; mentions: number }>()
    chartTracks.slice(0, 50).forEach((item) => {
      const artist = item.track.artists[0]
      if (!artist) return
      const artistId = artist.id || artist.name
      const prev = map.get(artistId)
      map.set(artistId, {
        id: artistId,
        name: artist.name,
        image: artist.id ? artistImages[artist.id] || "/placeholder.svg?height=320&width=320" : "/placeholder.svg?height=320&width=320",
        mentions: (prev?.mentions || 0) + 1,
      })
    })

    return Array.from(map.values())
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 12)
  }, [chartTracks, artistImages])

  const mostReviewedTracks = useMemo(() => {
    const map = new Map<string, { id: string; name: string; artist: string; image: string; count: number; avg: number; total: number }>()

    realReviews.forEach((review) => {
      const song = review.songs
      if (!song?.name) return
      const key = review.song_id || `${song.name}-${song.artist_name}`
      const entry = map.get(key)
      const rating = review.ratings?.rating || 0

      if (!entry) {
        map.set(key, {
          id: song.id || key,
          name: song.name,
          artist: song.artist_name,
          image: song.album_image_url || "/placeholder.svg?height=320&width=320",
          count: 1,
          avg: rating,
          total: rating,
        })
      } else {
        const total = entry.total + rating
        const count = entry.count + 1
        map.set(key, { ...entry, count, total, avg: total / count })
      }
    })

    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 12)
  }, [realReviews])

  const getReviewMeta = (review: RealReview) => {
    const songId = review.song_id || review.songs?.id || ""
    const isAlbum = songId.startsWith("album:")
    return {
      isAlbum,
      badge: isAlbum ? "Album" : "Song",
      link: isAlbum ? `/album/${songId.replace(/^album:/, "")}` : `/song/${songId}`,
      cover: review.songs?.album_image_url || "/placeholder.svg?height=120&width=120",
      title: review.songs?.name || "Unknown",
      subtitle: review.songs?.artist_name || "Unknown artist",
    }
  }

  const heroImage =
    chartTracks[0]?.track.album.images[0]?.url ||
    newReleases[0]?.images[0]?.url ||
    "/placeholder.svg?height=700&width=1200"

  return (
    <div className="min-h-screen bg-[#040507] text-white pb-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_0%,rgba(76,180,255,0.18),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(255,99,132,0.18),transparent_35%),linear-gradient(180deg,#040507_0%,#080c14_50%,#06070a_100%)]" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        <section className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative min-h-[360px] rounded-[2rem] overflow-hidden border border-white/15 bg-white/5"
          >
            <Image
              src={heroImage}
              alt={newReleases[0]?.name || "Featured"}
              fill
              className="object-cover scale-105 blur-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/30 to-transparent" />
            <div className="absolute inset-0 p-7 md:p-10 flex flex-col justify-end">
              <Badge className="w-fit mb-4 bg-white/15 text-white border border-white/20">Review Spotlight</Badge>
              <h1 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-xl">
                Beatshelf is your Letterboxd for music discovery.
              </h1>
              <p className="text-white/70 mt-3 max-w-lg">Rate tracks, write rich reviews, and discover what real listeners think.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="rounded-2xl bg-red-500 hover:bg-red-400 text-white" asChild>
                  <Link href="/write-review">Write a Review</Link>
                </Button>
                <Button variant="outline" className="rounded-2xl border-white/30 bg-black/25 hover:bg-white/10" asChild>
                  <Link href="/explore">Explore Music</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl p-6 space-y-4">
            <h3 className="text-xl font-semibold">Recent Reviews Feed</h3>
            <p className="text-sm text-white/60">Fresh opinions from the community right now.</p>
            <div className="space-y-3">
              {realReviews.slice(0, 4).map((review) => {
                const meta = getReviewMeta(review)
                return (
                <Link key={review.id} href={meta.link} className="block rounded-2xl border border-white/10 bg-black/35 p-3 hover:bg-black/55 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {review.profiles?.avatar_url ? (
                      <Image src={review.profiles.avatar_url} alt="avatar" width={36} height={36} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                        <UserRound className="w-4 h-4 text-white/70" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{review.profiles?.username || "Anonymous"}</p>
                      <p className="text-xs text-white/55 truncate">{meta.title}</p>
                    </div>
                    <Badge className="rounded-full bg-white/10 border border-white/20 text-white/90">
                      {meta.isAlbum ? <Disc3 className="w-3 h-3 mr-1" /> : <Mic2 className="w-3 h-3 mr-1" />}
                      {meta.badge}
                    </Badge>
                    <StarRating rating={review.ratings?.rating || 0} readonly size="sm" />
                  </div>
                </Link>
              )})}
            </div>
          </div>
        </section>

        <ScrollSection title="Trending Songs" subtitle="Most discussed songs this week" href="/trending">
          {(loading ? Array.from({ length: 6 }) : chartTracks.slice(0, 12)).map((item, index) => {
            if (loading) return <SkeletonCard key={`song-skeleton-${index}`} />
            const track = (item as { track: SpotifyTrack }).track
            return (
              <motion.article key={track.id} whileHover={{ y: -6 }} className="group min-w-[280px] md:min-w-[320px] snap-start">
                <Link href={`/song/${track.id}`} className="block relative h-[360px] rounded-3xl overflow-hidden border border-white/10">
                  <Image src={track.album.images[0]?.url || "/placeholder.svg?height=500&width=500"} alt={track.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/25 backdrop-blur-[2px] transition-opacity" />
                  <div className="absolute bottom-0 p-5 w-full">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/65">Trending Song</p>
                    <h3 className="text-2xl font-semibold line-clamp-1 mt-1">{track.name}</h3>
                    <p className="text-sm text-white/70 line-clamp-1">{track.artists.map((a) => a.name).join(", ")}</p>
                    <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="rounded-xl bg-white text-black hover:bg-white/90">Rate</Button>
                      <Button size="sm" variant="outline" className="rounded-xl border-white/30 bg-black/30 hover:bg-white/15">Review</Button>
                    </div>
                  </div>
                </Link>
              </motion.article>
            )
          })}
        </ScrollSection>

        <ScrollSection title="Trending Artists" subtitle="Artists driving conversation and ratings" href="/trending">
          {trendingArtists.map((artist) => (
            <article key={artist.id} className="min-w-[220px] md:min-w-[240px] snap-start rounded-3xl border border-white/10 bg-white/[0.05] p-3 group hover:bg-white/[0.08] transition-colors">
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image src={artist.image} alt={artist.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <h3 className="font-semibold text-lg mt-3 line-clamp-1">{artist.name}</h3>
              <p className="text-sm text-white/60">{artist.mentions} chart mentions</p>
              <Button className="mt-3 w-full rounded-xl bg-transparent border border-white/25 hover:bg-white/10">Open Discussions</Button>
            </article>
          ))}
        </ScrollSection>

        <ScrollSection title="Top Rated Albums" subtitle="Community favorites from current releases" href="/albums">
          {(loading ? Array.from({ length: 6 }) : newReleases.slice(0, 12)).map((album, index) => {
            if (loading) return <SkeletonCard key={`album-skeleton-${index}`} />
            return (
              <article key={(album as NewReleaseAlbum).id} className="min-w-[250px] md:min-w-[280px] snap-start rounded-3xl border border-white/10 bg-white/[0.05] overflow-hidden group">
                <Link href={`/album/${(album as NewReleaseAlbum).id}`}>
                  <div className="relative aspect-[4/5]">
                    <Image src={(album as NewReleaseAlbum).images[0]?.url || "/placeholder.svg?height=600&width=480"} alt={(album as NewReleaseAlbum).name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-semibold text-xl line-clamp-1">{(album as NewReleaseAlbum).name}</h3>
                      <p className="text-sm text-white/70 line-clamp-1">{(album as NewReleaseAlbum).artists.map((a) => a.name).join(", ")}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-white/50 italic">Not yet rated</span>
                        <span className="text-xs text-white/60">{new Date((album as NewReleaseAlbum).release_date).getFullYear()}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </article>
            )
          })}
        </ScrollSection>

        <ScrollSection title="Most Reviewed Tracks" subtitle="Songs with the most review activity" href="/reviews">
          {mostReviewedTracks.map((track) => (
            <article key={track.id} className="min-w-[300px] snap-start rounded-3xl border border-white/10 bg-white/[0.05] p-4 overflow-hidden">
              <div className="flex items-center gap-4">
                <Image src={track.image} alt={track.name} width={84} height={84} className="rounded-2xl object-cover" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-lg line-clamp-1">{track.name}</h3>
                  <p className="text-sm text-white/65 line-clamp-1">{track.artist}</p>
                  <p className="text-xs text-white/55 mt-1">{track.count} reviews</p>
                  <div className="mt-2"><StarRating rating={track.avg} readonly size="sm" /></div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" className="rounded-xl bg-white text-black hover:bg-white/90" asChild>
                  <Link href="/reviews">Read Reviews</Link>
                </Button>
                <Button size="sm" variant="outline" className="rounded-xl border-white/25 bg-transparent hover:bg-white/10" asChild>
                  <Link href={`/song/${track.id}`}>Write Review</Link>
                </Button>
              </div>
            </article>
          ))}
        </ScrollSection>

        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Recent Reviews Feed</h2>
              <p className="text-white/55 text-sm mt-1">Social-first review stream with opinions that matter.</p>
            </div>
            <Link href="/reviews" className="text-sm text-white/70 hover:text-white inline-flex items-center">
              Open feed <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {realReviews.slice(0, 6).map((review) => {
              const meta = getReviewMeta(review)
              return (
              <article key={review.id} className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5 hover:bg-white/[0.08] transition-colors overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {review.profiles?.avatar_url ? (
                      <Image src={review.profiles.avatar_url} alt="avatar" width={30} height={30} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-[30px] h-[30px] rounded-full bg-white/10 flex items-center justify-center">
                        <UserRound className="w-3.5 h-3.5 text-white/70" />
                      </div>
                    )}
                    <p className="font-medium truncate">{review.profiles?.username || "Anonymous"}</p>
                  </div>
                  <Badge className="rounded-full bg-white/10 border border-white/20 text-white/90">
                    {meta.isAlbum ? <Disc3 className="w-3 h-3 mr-1" /> : <Mic2 className="w-3 h-3 mr-1" />}
                    {meta.badge}
                  </Badge>
                  <StarRating rating={review.ratings?.rating || 0} readonly size="sm" />
                </div>
                <p className="text-sm text-white/60 mt-1">on {meta.title}</p>
                <div 
                  className="text-sm text-white/80 mt-4 line-clamp-4 prose prose-invert prose-sm max-w-none prose-p:text-white/80 prose-strong:text-white prose-em:text-white/75 prose-blockquote:text-white/70 prose-li:text-white/80"
                  dangerouslySetInnerHTML={{ __html: renderReviewContent(review.content) }}
                />
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="rounded-xl border-white/25 bg-transparent hover:bg-white/10" asChild>
                    <Link href={meta.link}><MessageCircle className="w-4 h-4 mr-2" />Discuss</Link>
                  </Button>
                </div>
              </article>
            )})}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-[#111a2f]/80 via-[#0f1524]/80 to-[#1d121b]/80 backdrop-blur-xl p-8 md:p-10 text-center">
          <p className="text-white/60 uppercase tracking-[0.2em] text-xs">Community-Driven Discovery</p>
          <h3 className="text-3xl md:text-4xl font-semibold mt-3">No playback-first UI. Just better music opinions.</h3>
          <p className="text-white/70 max-w-2xl mx-auto mt-3">
            Beatshelf helps people discover their next favorite artist through ratings, thoughtful reviews, and active discussion.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Button className="rounded-2xl bg-red-500 hover:bg-red-400" asChild>
              <Link href="/write-review">Start Reviewing</Link>
            </Button>
            <Button variant="outline" className="rounded-2xl border-white/30 bg-transparent hover:bg-white/10" asChild>
              <Link href="/trending"><TrendingUp className="w-4 h-4 mr-2" />View Leaderboards</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}
