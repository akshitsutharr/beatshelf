"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/ui/star-rating"
import { MessageCircle, Loader2, ThumbsUp, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Review {
  id: string
  content: string
  created_at: string
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

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    fetchReviews()

    // Set up real-time subscription for new reviews
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
          user_id,
          profiles!inner (username, avatar_url),
          songs!inner (id, name, artist_name, album_image_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Reviews fetch error:", error)
        throw error
      }

      if (reviewsData) {
        // Fetch additional data for each review in parallel
        const reviewsWithData = await Promise.all(
          reviewsData.map(async (review) => {
            const [ratingResult, likesResult, userLikeResult] = await Promise.allSettled([
              // Get user's rating for this song
              supabase
                .from("ratings")
                .select("rating")
                .eq("song_id", review.songs.id)
                .eq("user_id", review.user_id)
                .single(),

              // Get likes count
              supabase
                .from("review_likes")
                .select("*", { count: "exact" })
                .eq("review_id", review.id),

              // Check if current user liked this review
              user
                ? supabase.from("review_likes").select("id").eq("review_id", review.id).eq("user_id", user.id).single()
                : Promise.resolve({ data: null }),
            ])

            return {
              ...review,
              ratings:
                ratingResult.status === "fulfilled" && ratingResult.value.data
                  ? { rating: ratingResult.value.data.rating }
                  : undefined,
              likes_count: likesResult.status === "fulfilled" ? likesResult.value.count || 0 : 0,
              user_liked: userLikeResult.status === "fulfilled" ? !!userLikeResult.value.data : false,
            }
          }),
        )

        setReviews(reviewsWithData)
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

      if (review.user_liked) {
        // Unlike
        await supabase.from("review_likes").delete().eq("review_id", reviewId).eq("user_id", user.id)
      } else {
        // Like
        await supabase.from("review_likes").insert({
          review_id: reviewId,
          user_id: user.id,
        })
      }

      // Update local state immediately
      setReviews(
        reviews.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                user_liked: !r.user_liked,
                likes_count: r.user_liked ? (r.likes_count || 0) - 1 : (r.likes_count || 0) + 1,
              }
            : r,
        ),
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      })
    }
  }

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="text-white text-lg">Loading community reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 pr-96">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Community Reviews</h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
              Discover what the community thinks about the latest tracks and timeless classics
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="bg-red-600/20 text-red-400 rounded-full">
                {reviews.length} Reviews
              </Badge>
              <Button
                onClick={fetchReviews}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800"
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                <CardContent className="py-12 text-center text-gray-400">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reviews found. Be the first to share your thoughts!</p>
                  <Button className="mt-4 bg-red-600 hover:bg-red-700 rounded-xl" asChild>
                    <Link href="/search">Find Music to Review</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card
                  key={review.id}
                  className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 rounded-3xl backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* User and Time */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={review.profiles.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gray-700 text-white">
                              {review.profiles.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-white">{review.profiles.username}</div>
                            <div className="text-sm text-gray-400">{formatTimeAgo(review.created_at)}</div>
                          </div>
                        </div>
                        <Badge className="bg-red-600/20 text-red-400 rounded-full">Review</Badge>
                      </div>

                      {/* Song Info */}
                      <Link href={`/song/${review.songs.id}`} className="block">
                        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                          <Image
                            src={
                              review.songs.album_image_url || "/placeholder.svg?height=80&width=80&query=album cover"
                            }
                            alt={review.songs.name}
                            width={80}
                            height={80}
                            className="rounded-xl shadow-md"
                          />
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-white">{review.songs.name}</h3>
                            <p className="text-gray-400">{review.songs.artist_name}</p>
                            {review.ratings && (
                              <div className="mt-2">
                                <StarRating rating={review.ratings.rating} readonly size="sm" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Review Content */}
                      <div className="prose prose-sm max-w-none">
                        <div
                          className="text-gray-300 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: review.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\*(.*?)\*/g, "<em>$1</em>")
                              .replace(/\n/g, "<br>"),
                          }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeReview(review.id)}
                          className={`${
                            review.user_liked ? "text-red-500 hover:text-red-400" : "text-gray-500 hover:text-red-500"
                          } rounded-xl`}
                        >
                          <ThumbsUp className={`w-4 h-4 mr-2 ${review.user_liked ? "fill-current" : ""}`} />
                          {review.likes_count || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white rounded-xl" asChild>
                          <Link href={`/song/${review.songs.id}`}>View Song</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Load More */}
          {reviews.length > 0 && (
            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800"
                onClick={fetchReviews}
              >
                Load More Reviews
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
