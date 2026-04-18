"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowUpRight,
  ChevronRight,
  Disc3,
  Flame,
  MessageCircle,
  Mic2,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { renderReviewContent } from "@/components/ui/rich-text-editor"
import type { LivingWallItem } from "@/components/living-music-wall"
import { supabase } from "@/lib/supabase"

const LivingMusicWall = dynamic(
  () => import("@/components/living-music-wall").then((module) => module.LivingMusicWall),
  { ssr: false },
)

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

function CinematicRail({
  title,
  subtitle,
  href,
  children,
}: {
  title: string
  subtitle: string
  href: string
  children: React.ReactNode
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleWheel = (event: WheelEvent) => {
      if (event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return

      const { scrollLeft, scrollWidth, clientWidth } = el
      const maxScroll = scrollWidth - clientWidth
      const atStart = scrollLeft <= 0 && event.deltaY < 0
      const atEnd = scrollLeft >= maxScroll && event.deltaY > 0

      if (atStart || atEnd) return

      event.preventDefault()
      el.scrollBy({ left: event.deltaY * 0.95, behavior: "auto" })
    }

    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [])

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">curated chapter</p>
          <h2 className="mt-2 text-3xl md:text-5xl font-semibold tracking-[-0.03em] leading-[0.95] text-white">
            {title}
          </h2>
          <p className="mt-3 text-sm md:text-base text-white/62 max-w-[54ch]">{subtitle}</p>
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center gap-1 text-sm text-white/70 hover:text-white transition-colors"
        >
          Open chapter <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative -mx-4 px-4 mask-edges-x">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory touch-pan-x no-scrollbar"
        >
          {children}
        </div>
      </div>
    </section>
  )
}

function SkeletonFilmPanel() {
  return (
    <div className="snap-start min-w-[310px] md:min-w-[420px] h-[420px] rounded-[2rem] border border-white/10 bg-white/[0.04] animate-pulse" />
  )
}

function formatSince(dateString: string) {
  const date = new Date(dateString)
  const diffMs = Date.now() - date.getTime()
  const hours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)))

  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`

  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function isLikelyEnglishTrack(track: SpotifyTrack) {
  const text = `${track.name} ${track.artists.map((artist) => artist.name).join(" ")}`
  return /^[\u0000-\u007F]+$/.test(text)
}

function isLikelyEnglishAlbum(album: NewReleaseAlbum) {
  const text = `${album.name} ${album.artists.map((artist) => artist.name).join(" ")}`
  return /^[\u0000-\u007F]+$/.test(text)
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
        .limit(20)

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
          }),
        )

        setRealReviews(formatted)
      }
    } catch (error) {
      console.error("Error fetching community reviews:", error)
    }
  }

  const trendingArtists = useMemo(() => {
    const map = new Map<string, { id: string; name: string; image: string; mentions: number }>()

    chartTracks.slice(0, 60).forEach((item) => {
      const artist = item.track.artists[0]
      if (!artist) return

      const artistId = artist.id || artist.name
      const previous = map.get(artistId)

      map.set(artistId, {
        id: artistId,
        name: artist.name,
        image: artist.id
          ? artistImages[artist.id] || "/placeholder.svg?height=320&width=320"
          : "/placeholder.svg?height=320&width=320",
        mentions: (previous?.mentions || 0) + 1,
      })
    })

    return Array.from(map.values())
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 14)
  }, [chartTracks, artistImages])

  const mostReviewedTracks = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; artist: string; image: string; count: number; avg: number; total: number }
    >()

    realReviews.forEach((review) => {
      const song = review.songs
      if (!song?.name) return

      const key = review.song_id || `${song.name}-${song.artist_name}`
      const rating = review.ratings?.rating || 0
      const existing = map.get(key)

      if (!existing) {
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
        const total = existing.total + rating
        const count = existing.count + 1

        map.set(key, {
          ...existing,
          count,
          total,
          avg: total / count,
        })
      }
    })

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
  }, [realReviews])

  const getReviewMeta = (review: RealReview) => {
    const songId = review.song_id || review.songs?.id || ""
    const isAlbum = songId.startsWith("album:")

    return {
      isAlbum,
      badge: isAlbum ? "Album" : "Song",
      link: isAlbum ? `/album/${songId.replace(/^album:/, "")}` : `/song/${songId}`,
      cover: review.songs?.album_image_url || "/placeholder.svg?height=200&width=200",
      title: review.songs?.name || "Unknown",
      subtitle: review.songs?.artist_name || "Unknown artist",
    }
  }

  const heroTrack = chartTracks[0]?.track
  const secondHeroTrack = chartTracks[1]?.track
  const heroAlbum = newReleases[0]
  const supportingAlbum = newReleases[1]
  const featuredReview = realReviews[0]

  const englishChartTracks = useMemo(
    () => chartTracks.filter((item) => isLikelyEnglishTrack(item.track)),
    [chartTracks],
  )

  const heroEnglishTrack = englishChartTracks[0]?.track
  const secondHeroEnglishTrack = englishChartTracks[1]?.track

  const kineticWords = useMemo(() => {
    const topTracks = chartTracks.slice(0, 6).map((item) => item.track.name)
    const topArtists = trendingArtists.slice(0, 6).map((artist) => artist.name)

    return [...topTracks, ...topArtists].filter(Boolean)
  }, [chartTracks, trendingArtists])

  const livingWallItems = useMemo<LivingWallItem[]>(() => {
    const songItems = englishChartTracks.slice(0, 12).map((item) => ({
      id: `song-${item.track.id}`,
      title: item.track.name,
      subtitle: item.track.artists.map((artist) => artist.name).join(", "),
      image: item.track.album.images[0]?.url || "/placeholder.svg?height=800&width=600",
      href: `/song/${item.track.id}`,
      kind: "song" as const,
    }))

    const albumItems = newReleases
      .filter((album) => isLikelyEnglishAlbum(album))
      .slice(0, 10)
      .map((album) => ({
        id: `album-${album.id}`,
        title: album.name,
        subtitle: album.artists.map((artist) => artist.name).join(", "),
        image: album.images[0]?.url || "/placeholder.svg?height=800&width=600",
        href: `/album/${album.id}`,
        kind: "album" as const,
      }))

    return [...songItems, ...albumItems]
  }, [englishChartTracks, newReleases])

  return (
    <div className="relative min-h-[100dvh] overflow-hidden pb-28 text-white">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-black" />

      <main className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 pt-10 md:pt-14 space-y-24 md:space-y-28">
        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-8 xl:gap-12 items-start min-h-[76dvh]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/80">
              <Sparkles className="h-3.5 w-3.5 text-red-300" />
              Beatshelf home
            </div>

            <h1 className="mt-6 max-w-[17ch] text-[2.5rem] sm:text-6xl xl:text-7xl font-semibold leading-[0.9] tracking-[-0.045em] text-balance">
              The Letterboxd for music culture, made for strong opinions.
            </h1>

            <p className="mt-6 text-base md:text-lg text-white/70 max-w-[58ch] leading-relaxed">
              Follow what people are spinning, score tracks in seconds, and read reviews that sound human. This is where
              albums become conversation and community taste maps what matters next.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="group rounded-full border border-red-300/40 bg-red-500/90 text-white hover:bg-red-400 px-5 py-6 active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <Link href="/write-review" className="inline-flex items-center gap-3">
                  Start reviewing
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-[1px]">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-white/20 bg-white/[0.03] px-5 py-6 text-white hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
              >
                <Link href="/explore">Explore catalog</Link>
              </Button>
            </div>

            <div className="mt-10 hidden sm:grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">daily pulse</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{chartTracks.length > 0 ? chartTracks.length : "--"}</p>
                <p className="text-sm text-white/60">chart tracks indexed</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">community voice</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{realReviews.length > 0 ? realReviews.length : "--"}</p>
                <p className="text-sm text-white/60">recent reviews loaded</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">artist heat</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{trendingArtists.length > 0 ? trendingArtists.length : "--"}</p>
                <p className="text-sm text-white/60">active artist stories</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
            className="relative min-h-[620px]"
          >
            <div className="absolute inset-0 rounded-[2.3rem] border border-white/10 bg-white/[0.03] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
              <div className="relative h-full rounded-[calc(2.3rem-0.5rem)] overflow-hidden bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
                <Image
                  src={heroEnglishTrack?.album.images[0]?.url || heroAlbum?.images[0]?.url || "/placeholder.svg?height=1000&width=800"}
                  alt={heroEnglishTrack?.name || heroAlbum?.name || "Featured release"}
                  fill
                  className="object-cover scale-[1.08]"
                  priority
                />
                <div className="absolute inset-0 bg-black/70" />

                <div className="absolute top-5 right-5 rounded-full border border-white/20 bg-black/45 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-white/80">
                  live spotlight
                </div>

                <div className="absolute left-5 right-5 bottom-5 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs text-white/80">
                    <Flame className="h-3.5 w-3.5 text-red-300" />
                    trending now
                  </div>

                  <h2 className="text-3xl sm:text-4xl font-semibold leading-[0.95] tracking-[-0.03em] max-w-[16ch]">
                    {heroEnglishTrack?.name || heroAlbum?.name || "Current community obsession"}
                  </h2>

                  <p className="text-sm sm:text-base text-white/70 max-w-[45ch]">
                    {heroEnglishTrack?.artists?.map((artist) => artist.name).join(", ") ||
                      heroAlbum?.artists?.map((artist) => artist.name).join(", ") ||
                      "Unknown artist"}
                  </p>

                  <div className="flex items-center gap-3">
                    <Button asChild className="rounded-full bg-white text-black hover:bg-white/90 px-4">
                      <Link href={heroEnglishTrack ? `/song/${heroEnglishTrack.id}` : heroAlbum ? `/album/${heroAlbum.id}` : "/explore"}>
                        Open discussion
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="rounded-full border-white/25 bg-black/30 text-white hover:bg-white/15 px-4"
                    >
                      <Link href="/trending">View rankings</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -left-3 md:-left-12 top-[7%] w-[50%] max-w-[270px] rounded-[1.7rem] border border-white/15 bg-black/45 p-2 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-sm float-slow">
              <div className="relative aspect-square rounded-[1.25rem] overflow-hidden">
                <Image
                  src={secondHeroEnglishTrack?.album.images[0]?.url || supportingAlbum?.images[0]?.url || "/placeholder.svg?height=500&width=500"}
                  alt={secondHeroEnglishTrack?.name || supportingAlbum?.name || "Support card"}
                  fill
                  className="object-cover"
                />
              </div>
              <p className="mt-3 text-sm font-medium line-clamp-1">{secondHeroEnglishTrack?.name || supportingAlbum?.name || "Up next"}</p>
              <p className="text-xs text-white/60 line-clamp-1">
                {secondHeroEnglishTrack?.artists?.[0]?.name || supportingAlbum?.artists?.[0]?.name || "Unknown artist"}
              </p>
            </div>

            {featuredReview && (
              <div className="absolute -right-2 md:-right-8 bottom-[8%] w-[73%] max-w-[360px] rounded-[1.8rem] border border-white/15 bg-black/60 p-4 shadow-[0_20px_48px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {featuredReview.profiles?.avatar_url ? (
                      <Image
                        src={featuredReview.profiles.avatar_url}
                        alt={featuredReview.profiles.username || "Reviewer avatar"}
                        width={32}
                        height={32}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                        <UserRound className="h-4 w-4 text-white/70" />
                      </div>
                    )}
                    <p className="text-sm font-medium truncate">{featuredReview.profiles?.username || "Anonymous"}</p>
                  </div>
                  <StarRating rating={featuredReview.ratings?.rating || 0} readonly size="sm" />
                </div>

                <div
                  className="mt-3 text-sm leading-relaxed line-clamp-4 text-white/85 prose prose-sm prose-invert max-w-none prose-p:text-white/85"
                  dangerouslySetInnerHTML={{ __html: renderReviewContent(featuredReview.content) }}
                />

                <div className="mt-3 text-xs text-white/55">{formatSince(featuredReview.created_at)}</div>
              </div>
            )}
          </motion.div>
        </section>

        <section className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-black/30 px-4 py-3 md:px-6 backdrop-blur-sm">
          <div className="marquee-track">
            {[...kineticWords, ...kineticWords].map((word, index) => (
              <span
                key={`${word}-${index}`}
                className="mx-3 inline-flex items-center gap-3 text-xs md:text-sm uppercase tracking-[0.22em] text-white/55"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-300/70" />
                {word}
              </span>
            ))}
          </div>
        </section>

        <div className="hidden md:block">
          <LivingMusicWall items={livingWallItems} />
        </div>

        <CinematicRail
          title="song reels"
          subtitle="Swipe through the tracks dominating conversations this week. Each panel is tuned for fast rating, deeper listening context, and immediate route to discussion."
          href="/trending"
        >
          {(loading ? Array.from({ length: 5 }) : englishChartTracks.slice(0, 10)).map((item, index) => {
            if (loading) return <SkeletonFilmPanel key={`song-skeleton-${index}`} />

            const track = (item as { track: SpotifyTrack }).track

            return (
              <motion.article
                key={track.id}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="snap-start min-w-[310px] md:min-w-[430px]"
              >
                <Link
                  href={`/song/${track.id}`}
                  className="group relative flex h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-black/40 p-2 shadow-[0_18px_42px_rgba(0,0,0,0.42)]"
                >
                  <div className="relative w-full rounded-[1.65rem] overflow-hidden">
                    <Image
                      src={track.album.images[0]?.url || "/placeholder.svg?height=800&width=800"}
                      alt={track.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/55" />

                    <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                      <Badge className="rounded-full border-white/25 bg-black/45 text-white backdrop-blur-sm">
                        <Flame className="mr-1 h-3 w-3" />
                        chart surge
                      </Badge>
                      <span className="rounded-full border border-white/20 bg-black/45 px-2.5 py-1 text-[11px] text-white/80">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="absolute inset-x-4 bottom-4">
                      <h3 className="text-2xl font-semibold tracking-tight line-clamp-1">{track.name}</h3>
                      <p className="mt-1 text-sm text-white/70 line-clamp-1">
                        {track.artists.map((artist) => artist.name).join(", ")}
                      </p>

                      <div className="mt-4 flex gap-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                        <Button size="sm" className="rounded-full bg-white text-black hover:bg-white/90">
                          Rate now
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full border-white/30 bg-black/30 text-white hover:bg-white/15"
                        >
                          Join thread
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.article>
            )
          })}
        </CinematicRail>

        <section className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-8 items-start">
          <article className="hidden xl:block rounded-[2.2rem] border border-white/12 bg-black/35 p-6 md:p-7 space-y-6 sticky top-24">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">community signal</p>
              <h2 className="mt-3 text-3xl md:text-5xl font-semibold leading-[0.95] tracking-[-0.03em] max-w-[12ch]">
                reviews with personality, not throwaway stars.
              </h2>
            </div>

            <p className="text-white/68 text-sm md:text-base max-w-[45ch]">
              Opinion is the product. Replies, echoes, and saved takes build context around every song and album instead
              of pushing you straight to playback.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-white/45 text-[10px] uppercase tracking-[0.2em]">active critics</p>
                <p className="mt-2 text-xl font-semibold">{Math.max(19, Math.floor(realReviews.length * 1.4))}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-white/45 text-[10px] uppercase tracking-[0.2em]">new threads</p>
                <p className="mt-2 text-xl font-semibold">{Math.max(7, Math.floor(realReviews.length * 0.35))}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-white/45 text-[10px] uppercase tracking-[0.2em]">album essays</p>
                <p className="mt-2 text-xl font-semibold">{Math.max(5, Math.floor(realReviews.length * 0.2))}</p>
              </div>
            </div>

            <Button asChild className="rounded-full bg-red-500 hover:bg-red-400 text-white w-full sm:w-auto">
              <Link href="/reviews" className="inline-flex items-center gap-2">
                Open review feed
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </article>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {realReviews.slice(0, 6).map((review, idx) => {
              const meta = getReviewMeta(review)

              return (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 34, filter: "blur(8px)" }}
                  whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: idx * 0.06 }}
                  className={`rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-5 md:p-6 backdrop-blur-sm ${idx % 3 === 1 ? "md:translate-y-10" : ""} ${idx >= 3 ? "hidden md:block" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {review.profiles?.avatar_url ? (
                        <Image
                          src={review.profiles.avatar_url}
                          alt={review.profiles.username || "Reviewer avatar"}
                          width={34}
                          height={34}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-[34px] w-[34px] rounded-full bg-white/10 flex items-center justify-center">
                          <UserRound className="h-4 w-4 text-white/70" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{review.profiles?.username || "Anonymous"}</p>
                        <p className="text-xs text-white/55">{formatSince(review.created_at)}</p>
                      </div>
                    </div>

                    <Badge className="rounded-full bg-black/45 border-white/25 text-white/90">
                      {meta.isAlbum ? <Disc3 className="w-3 h-3 mr-1" /> : <Mic2 className="w-3 h-3 mr-1" />}
                      {meta.badge}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-2xl overflow-hidden border border-white/15">
                      <Image src={meta.cover} alt={meta.title} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white/60 line-clamp-1">on {meta.title}</p>
                      <p className="text-sm font-medium line-clamp-1">{meta.subtitle}</p>
                    </div>
                  </div>

                  <div
                    className="mt-4 text-sm text-white/82 leading-relaxed line-clamp-5 prose prose-sm prose-invert max-w-none prose-p:text-white/82"
                    dangerouslySetInnerHTML={{ __html: renderReviewContent(review.content) }}
                  />

                  <div className="mt-5 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
                    <div className="flex items-center gap-4 text-xs text-white/60">
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        replies
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        echoes
                      </span>
                      <span>saves</span>
                    </div>
                    <StarRating rating={review.ratings?.rating || 0} readonly size="sm" />
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-full border-white/30 bg-black/30 text-white hover:bg-white/12"
                    >
                      <Link href={meta.link}>open take</Link>
                    </Button>
                  </div>
                </motion.article>
              )
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 md:gap-8">
          <article className="rounded-[2rem] border border-white/10 bg-black/35 p-6 md:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">artist radar</p>
                <h3 className="mt-2 text-3xl md:text-4xl font-semibold tracking-[-0.03em] leading-[0.95]">who is moving culture</h3>
              </div>
              <Link href="/artists" className="text-sm text-white/70 hover:text-white transition-colors">
                Browse all
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              {trendingArtists.slice(0, 6).map((artist, index) => (
                <Link
                  key={artist.id}
                  href={`/artist/${artist.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-3 hover:bg-white/[0.06] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <div className="relative h-14 w-14 overflow-hidden rounded-xl">
                    <Image src={artist.image} alt={artist.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white line-clamp-1">{artist.name}</p>
                    <p className="text-xs text-white/60">{artist.mentions} chart mentions this cycle</p>
                  </div>
                  <span className="text-[11px] text-white/45">#{index + 1}</span>
                </Link>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-black/40 p-6 md:p-8">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/50">review heat map</p>
            <h3 className="mt-2 text-3xl md:text-4xl font-semibold tracking-[-0.03em] leading-[0.96]">tracks everyone is debating</h3>

            <div className="mt-6 space-y-4">
              {mostReviewedTracks.slice(0, 5).map((track, index) => (
                <Link
                  key={track.id}
                  href={`/song/${track.id}`}
                  className="block rounded-2xl border border-white/12 bg-black/35 p-3 hover:bg-black/45 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden">
                      <Image src={track.image} alt={track.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium line-clamp-1">{track.name}</p>
                      <p className="text-xs text-white/62 line-clamp-1">{track.artist}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <StarRating rating={track.avg} readonly size="sm" />
                        <span className="text-xs text-white/58">{track.count} reviews</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-white/45">rank</p>
                      <p className="text-sm font-medium">{index + 1}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-[2.4rem] border border-white/12 bg-black/35 p-7 md:p-12 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -top-12 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

          <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 items-end">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">final chapter</p>
              <h2 className="mt-3 text-4xl md:text-6xl font-semibold tracking-[-0.04em] leading-[0.92] max-w-[12ch] text-balance">
                your taste has context here.
              </h2>
              <p className="mt-5 text-white/68 max-w-[58ch] text-base md:text-lg leading-relaxed">
                Build a public shelf, write the reviews only you can write, and discover people whose listening lens matches
                yours.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-red-500 hover:bg-red-400 text-white px-6 py-6">
                  <Link href="/sign-up">Create profile</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-white/25 bg-black/40 text-white hover:bg-white/10 px-6 py-6"
                >
                  <Link href="/community" className="inline-flex items-center gap-2">
                    Visit community
                    <TrendingUp className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">signal recap</p>
                <p className="mt-2 text-2xl font-semibold">{mostReviewedTracks.length || 0} debated tracks this cycle</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">activity trend</p>
                <p className="mt-2 text-2xl font-semibold">{Math.max(31, realReviews.length * 3)} new reactions in feed</p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">discoverability</p>
                <p className="mt-2 text-2xl font-semibold">{trendingArtists.length || 0} artists surfacing now</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
