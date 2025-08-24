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
      <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 sm:space-y-4">
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Community Reviews</h1>
            </div>
            <p className="text-gray-400 max-w-xl mx-auto text-xs sm:text-sm md:text-base px-4">
              Discover what the community thinks about the latest tracks and timeless classics
            </p>
            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <Badge variant="secondary" className="bg-red-600/20 text-red-400 rounded-full text-xs sm:text-sm">
                {reviews.length} Reviews
              </Badge>
              <Button
                onClick={fetchReviews}
                disabled={refreshing}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800 text-xs sm:text-sm"
              >
                {refreshing ? (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>

          {/* Reviews Grid */}
          <div className="space-y-4 sm:space-y-6">
            {reviews.length === 0 ? (
              <Card className="bg-gray-900/50 border-gray-800 rounded-2xl sm:rounded-3xl backdrop-blur-sm">
                <CardContent className="py-8 sm:py-12 text-center text-gray-400">
                  <MessageCircle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                  <p className="text-sm sm:text-base">No reviews found. Be the first to share your thoughts!</p>
                  <Button className="mt-3 sm:mt-4 bg-red-600 hover:bg-red-700 rounded-xl text-xs sm:text-sm" asChild>
                    <Link href="/search">Find Music to Review</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              reviews.map((review) => (
                <Card
                  key={review.id}
                  className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 rounded-2xl sm:rounded-3xl backdrop-blur-sm"
                >
                  <CardContent className="p-3 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {/* User and Time */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="h-8 w-8 sm:h-12 sm:w-12">
                            <AvatarImage src={review.profiles.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gray-700 text-white text-xs sm:text-base">
                              {review.profiles.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-white text-xs sm:text-base">
                              {review.profiles.username.length > 15 ? review.profiles.username.substring(0, 15) + "..." : review.profiles.username}
                            </div>
                            <div className="text-xs text-gray-400">{formatTimeAgo(review.created_at)}</div>
                          </div>
                        </div>
                        <Badge className="bg-red-600/20 text-red-400 rounded-full text-xs">Review</Badge>
                      </div>

                      {/* Song Info */}
                      <Link href={`/song/${review.songs.id}`} className="block">
                        <div className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 rounded-xl sm:rounded-2xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                          <Image
                            src={
                              review.songs.album_image_url || "/placeholder.svg?height=80&width=80&query=album cover"
                            }
                            alt={review.songs.name}
                            width={60}
                            height={60}
                            className="w-12 h-12 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl shadow-md"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white text-sm sm:text-lg truncate">
                              {review.songs.name.length > 25 ? review.songs.name.substring(0, 25) + "..." : review.songs.name}
                            </h3>
                            <p className="text-gray-400 text-xs sm:text-base truncate">
                              {review.songs.artist_name.length > 20 ? review.songs.artist_name.substring(0, 20) + "..." : review.songs.artist_name}
                            </p>
                            {review.ratings && (
                              <div className="mt-1 sm:mt-2">
                                <StarRating rating={review.ratings.rating} readonly size="sm" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Review Content */}
                      <div className="prose prose-sm max-w-none">
                        <div
                          className="text-gray-300 leading-relaxed text-xs sm:text-sm"
                          dangerouslySetInnerHTML={{
                            __html: (review.content.length > 200 ? review.content.substring(0, 200) + "..." : review.content)
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\*(.*?)\*/g, "<em>$1</em>")
                              .replace(/\n/g, "<br>"),
                          }}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 sm:gap-4 pt-2 sm:pt-4 border-t border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeReview(review.id)}
                          className={`${
                            review.user_liked ? "text-red-500 hover:text-red-400" : "text-gray-500 hover:text-red-500"
                          } rounded-xl text-xs sm:text-sm`}
                        >
                          <ThumbsUp className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${review.user_liked ? "fill-current" : ""}`} />
                          {review.likes_count || 0}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-500 hover:text-white rounded-xl text-xs sm:text-sm" asChild>
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
