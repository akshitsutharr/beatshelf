"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { Disc3, MessageCircle, Mic2, RefreshCw, ThumbsUp, Loader2, Sparkles } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { renderReviewContent } from "@/components/ui/rich-text-editor"
import { useToast } from "@/hooks/use-toast"

interface Review {
  id: string
  content: string
  created_at: string
  song_id?: string
  user_id: string
  profiles: {
    username: string
    avatar_url?: string
  }
  songs: {
    id: string
    name: string
    artist_name: string
    album_image_url?: string
  }
  ratings?: {
    rating: number
  }
  likes_count?: number
  user_liked?: boolean
}

type SortMode = "helpful" | "latest" | "highest"

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>("helpful")
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchReviews()

    const reviewsSubscription = supabase
      .channel("reviews-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
        fetchReviews()
      })
      .subscribe()

    return () => {
      reviewsSubscription.unsubscribe()
    }
  }, [])

  const fetchReviews = async () => {
    if (!loading) setRefreshing(true)

    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select(`
          id,
          content,
          created_at,
          song_id,
          user_id,
          profiles (username, avatar_url),
          songs (id, name, artist_name, album_image_url)
        `)
        .order("created_at", { ascending: false })
        .limit(80)

      if (error) throw error

      if (reviewsData) {
        const merged = await Promise.all(
          reviewsData.map(async (review) => {
            const songId = review.song_id || (Array.isArray(review.songs) ? review.songs[0]?.id : review.songs?.id)
            const dbUserId = user?.id || null
            const [ratingResult, likesResult, userLikeResult] = await Promise.allSettled([
              songId ? supabase
                .from("ratings")
                .select("rating")
                .eq("song_id", songId)
                .eq("user_id", review.user_id)
                .single() : Promise.resolve({ data: null }),
              supabase.from("review_likes").select("*", { count: "exact" }).eq("review_id", review.id),
              dbUserId ? supabase.from("review_likes").select("id").eq("review_id", review.id).eq("user_id", dbUserId).single() : Promise.resolve({ data: null }),
            ])

            return {
              ...review,
              profiles: Array.isArray(review.profiles) ? review.profiles[0] : (review.profiles || {}),
              songs: Array.isArray(review.songs) ? review.songs[0] : (review.songs || {}),
              ratings:
                ratingResult.status === "fulfilled" && ratingResult.value.data
                  ? { rating: ratingResult.value.data.rating }
                  : undefined,
              likes_count: likesResult.status === "fulfilled" ? likesResult.value.count || 0 : 0,
              user_liked: userLikeResult.status === "fulfilled" ? !!userLikeResult.value.data : false,
            } as Review
          })
        )

        setReviews(merged)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
      toast({
        title: "Error",
        description: "Failed to load reviews",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleLikeReview = async (reviewId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like reviews",
        variant: "destructive",
      })
      return
    }

    try {
      const review = reviews.find((r) => r.id === reviewId)
      if (!review) return

      const action = review.user_liked ? "unlike" : "like"
      
      const response = await fetch("/api/reviews/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, action })
      })

      if (!response.ok) {
        throw new Error("Failed to update like on server")
      }

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                user_liked: !r.user_liked,
                likes_count: r.user_liked ? (r.likes_count || 0) - 1 : (r.likes_count || 0) + 1,
              }
            : r
        )
      )
    } catch {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      })
    }
  }

  const sortedReviews = useMemo(() => {
    const list = [...reviews]
    if (sortMode === "latest") {
      return list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
    }
    if (sortMode === "highest") {
      return list.sort((a, b) => (b.ratings?.rating || 0) - (a.ratings?.rating || 0))
    }
    return list.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
  }, [reviews, sortMode])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-white mx-auto" />
          <p className="text-white/70">Loading community feed...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white pb-16">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_8%_0%,rgba(251,146,60,0.17),transparent_35%),radial-gradient(circle_at_88%_22%,rgba(56,189,248,0.15),transparent_33%)]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-7">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-7 md:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/50">Social Feed</p>
              <h1 className="text-4xl md:text-5xl font-semibold mt-2 tracking-tight">Community Reviews</h1>
              <p className="text-white/65 mt-3 max-w-2xl">A clean, content-first stream of music opinions, ratings, and conversation.</p>
            </div>
            <Badge className="rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" /> {reviews.length} reviews
            </Badge>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setSortMode("helpful")} className={`rounded-xl ${sortMode === "helpful" ? "bg-white text-black hover:bg-white/90" : "bg-black/35 text-white hover:bg-white/10 border border-white/20"}`}>
              Most Helpful
            </Button>
            <Button onClick={() => setSortMode("latest")} className={`rounded-xl ${sortMode === "latest" ? "bg-white text-black hover:bg-white/90" : "bg-black/35 text-white hover:bg-white/10 border border-white/20"}`}>
              Latest
            </Button>
            <Button onClick={() => setSortMode("highest")} className={`rounded-xl ${sortMode === "highest" ? "bg-white text-black hover:bg-white/90" : "bg-black/35 text-white hover:bg-white/10 border border-white/20"}`}>
              Highest Rated
            </Button>
            <Button
              onClick={fetchReviews}
              disabled={refreshing}
              variant="outline"
              className="rounded-xl border-white/20 bg-transparent hover:bg-white/10"
            >
              {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Refresh
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          {sortedReviews.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-10 text-center">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-white/50" />
              <p className="text-white/70">No reviews found yet. Start the conversation.</p>
              <Button className="mt-4 rounded-xl bg-white text-black hover:bg-white/90" asChild>
                <Link href="/write-review">Write First Review</Link>
              </Button>
            </div>
          ) : (
            sortedReviews.map((review, index) => {
              const reviewTargetId = review.song_id || review.songs?.id || ""
              const isAlbumReview = reviewTargetId.startsWith("album:")
              const destination = isAlbumReview ? `/album/${reviewTargetId.replace(/^album:/, "")}` : `/song/${reviewTargetId}`

              return (
              <article
                key={review.id}
                className="rounded-[1.7rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5 md:p-6 hover:bg-white/[0.07] transition-colors"
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={review.profiles?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-white/10 text-white">
                        {review.profiles?.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{review.profiles?.username || "Anonymous"}</p>
                      <p className="text-xs text-white/50">{formatTimeAgo(review.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating rating={review.ratings?.rating || 0} readonly size="sm" />
                    <Badge className="rounded-full bg-white/10 text-white border border-white/15">
                      {isAlbumReview ? <Disc3 className="w-3 h-3 mr-1" /> : <Mic2 className="w-3 h-3 mr-1" />}
                      {isAlbumReview ? "Album" : "Song"}
                    </Badge>
                  </div>
                </div>

                <Link href={destination} className="mt-4 block rounded-2xl border border-white/10 bg-black/35 p-3 hover:bg-black/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Image
                      src={review.songs?.album_image_url || "/placeholder.svg?height=100&width=100"}
                      alt={review.songs?.name || "Unknown Track"}
                      width={58}
                      height={58}
                      className="rounded-xl object-cover"
                    />
                    <div className="min-w-0">
                      <p className="font-medium line-clamp-1">{review.songs?.name || "Unknown Track"}</p>
                      <p className="text-sm text-white/60 line-clamp-1">{review.songs?.artist_name || "Unknown Artist"}</p>
                    </div>
                  </div>
                </Link>

                <div 
                  className="mt-4 text-[15px] leading-7 text-white/85 whitespace-pre-wrap prose prose-invert prose-sm max-w-none prose-p:text-white/85 flex flex-col"
                  dangerouslySetInnerHTML={{ 
                    __html: renderReviewContent(review.content.length > 520 ? `${review.content.slice(0, 520)}...` : review.content) 
                  }}
                />

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleLikeReview(review.id)}
                    className={`rounded-xl border-white/20 ${review.user_liked ? "bg-red-500/20 text-red-300 hover:bg-red-500/30" : "bg-transparent hover:bg-white/10"}`}
                  >
                    <ThumbsUp className={`w-4 h-4 mr-2 ${review.user_liked ? "fill-current" : ""}`} />
                    {review.likes_count || 0}
                  </Button>
                  <Button variant="outline" className="rounded-xl border-white/20 bg-transparent hover:bg-white/10" asChild>
                    <Link href={destination}>
                      <MessageCircle className="w-4 h-4 mr-2" /> Open Track Discussion
                    </Link>
                  </Button>
                </div>
              </article>
            )})
          )}
        </section>
      </div>
    </div>
  )
}
