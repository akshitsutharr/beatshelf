"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Heart, Play, Pause, Clock, Calendar, ExternalLink, MessageCircle, ThumbsUp, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface Song {
  id: string
  name: string
  artist_name: string
  album_name: string
  album_image_url?: string
  preview_url?: string
  duration_ms?: number
  release_date?: string
  spotify_url?: string
  avg_rating?: number
  total_ratings?: number
  total_reviews?: number
  total_favorites?: number
  popularity?: number
  explicit?: boolean
}

interface Review {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    avatar_url?: string
  }
  ratings?: {
    rating: number
  }
  likes_count: number
  user_liked: boolean
}

export default function SongDetailPage() {
  const params = useParams()
  const songId = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()

  const [song, setSong] = useState<Song | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [userRating, setUserRating] = useState<number>(0)
  const [userReview, setUserReview] = useState("")
  const [isFavorited, setIsFavorited] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (songId) {
      fetchSongDetails()
      fetchReviews()
      if (user) {
        fetchUserData()
      }
    }
  }, [songId, user])

  const fetchSongDetails = async () => {
    try {
      // First try to get from our database
      const { data: dbSong, error: dbError } = await supabase
        .rpc("get_song_with_stats", { song_id_param: songId })
        .single()

      if (dbSong) {
        setSong(dbSong)
      } else {
        // If not in database, fetch from Spotify via our API route
        try {
          const response = await fetch(`/api/spotify/track/${songId}`)

          if (!response.ok) {
            const errorData = await response.json()
            if (response.status === 404) {
              throw new Error("Song not found on Spotify")
            } else {
              throw new Error(errorData.error || `API error: ${response.status}`)
            }
          }

          const spotifyTrack = await response.json()

          const formattedSong = {
            id: spotifyTrack.id,
            name: spotifyTrack.name,
            artist_name: spotifyTrack.artists.map((a: any) => a.name).join(", "),
            album_name: spotifyTrack.album.name,
            album_image_url: spotifyTrack.album.images[0]?.url,
            preview_url: spotifyTrack.preview_url,
            duration_ms: spotifyTrack.duration_ms,
            release_date: spotifyTrack.album.release_date,
            spotify_url: spotifyTrack.external_urls.spotify,
            avg_rating: 0,
            total_ratings: 0,
            total_reviews: 0,
            total_favorites: 0,
            popularity: spotifyTrack.popularity,
            explicit: spotifyTrack.explicit,
          }

          // Cache in database
          const { error: insertError } = await supabase.from("songs").upsert(formattedSong)
          if (insertError) {
            console.warn("Failed to cache song in database:", insertError)
          }

          setSong(formattedSong)
        } catch (spotifyError) {
          console.error("Spotify API error:", spotifyError)
          toast({
            title: "Song not found",
            description: spotifyError instanceof Error ? spotifyError.message : "Failed to fetch song from Spotify",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error fetching song:", error)
      toast({
        title: "Error",
        description: "Failed to fetch song details",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles (
            username,
            avatar_url
          )
        `)
        .eq("song_id", songId)
        .order("created_at", { ascending: false })

      if (reviewsData) {
        // Fetch additional data for each review
        const reviewsWithData = await Promise.all(
          reviewsData.map(async (review) => {
            // Get user's rating for this song
            const { data: ratingData } = await supabase
              .from("ratings")
              .select("rating")
              .eq("song_id", songId)
              .eq("user_id", review.user_id)
              .single()

            // Get likes count
            const { count: likesCount } = await supabase
              .from("review_likes")
              .select("*", { count: "exact" })
              .eq("review_id", review.id)

            // Check if current user liked this review
            let userLiked = false
            if (user) {
              const { data: userLikeData } = await supabase
                .from("review_likes")
                .select("id")
                .eq("review_id", review.id)
                .eq("user_id", user.id)
                .single()

              userLiked = !!userLikeData
            }

            return {
              ...review,
              ratings: ratingData,
              likes_count: likesCount || 0,
              user_liked: userLiked,
            }
          }),
        )

        setReviews(reviewsWithData)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
  }

  const fetchUserData = async () => {
    if (!user) return

    try {
      // Fetch user's rating
      const { data: rating } = await supabase
        .from("ratings")
        .select("rating")
        .eq("user_id", user.id)
        .eq("song_id", songId)
        .single()

      if (rating) {
        setUserRating(rating.rating)
      }

      // Fetch user's review
      const { data: review } = await supabase
        .from("reviews")
        .select("content")
        .eq("user_id", user.id)
        .eq("song_id", songId)
        .single()

      if (review) {
        setUserReview(review.content)
      }

      // Check if favorited
      const { data: favorite } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("song_id", songId)
        .single()

      setIsFavorited(!!favorite)
    } catch (error) {
      // Errors are expected when no data exists
    }
  }

  const handleRatingChange = async (rating: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to rate songs",
        variant: "destructive",
      })
      return
    }

    try {
      // Ensure song exists in database first
      if (song) {
        await supabase.from("songs").upsert({
          id: song.id,
          name: song.name,
          artist_name: song.artist_name,
          album_name: song.album_name,
          album_image_url: song.album_image_url,
          preview_url: song.preview_url,
          duration_ms: song.duration_ms,
          release_date: song.release_date,
          spotify_url: song.spotify_url,
        })
      }

      await supabase.from("ratings").upsert({
        user_id: user.id,
        song_id: songId,
        rating,
      })

      setUserRating(rating)
      toast({
        title: "Rating saved",
        description: `You rated this song ${rating}/5`,
      })

      // Refresh song stats
      fetchSongDetails()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive",
      })
    }
  }

  const handleReviewSubmit = async () => {
    if (!user || !userReview.trim()) return

    setSubmitting(true)
    try {
      // Ensure song exists in database first
      if (song) {
        await supabase.from("songs").upsert({
          id: song.id,
          name: song.name,
          artist_name: song.artist_name,
          album_name: song.album_name,
          album_image_url: song.album_image_url,
          preview_url: song.preview_url,
          duration_ms: song.duration_ms,
          release_date: song.release_date,
          spotify_url: song.spotify_url,
        })
      }

      // Insert/update review
      const { error: reviewError } = await supabase.from("reviews").upsert({
        user_id: user.id,
        song_id: songId,
        content: userReview.trim(),
      })

      if (reviewError) throw reviewError

      toast({
        title: "Review published!",
        description: "Your review has been shared with the community",
      })

      // Immediately refresh reviews and song stats
      await Promise.all([fetchReviews(), fetchSongDetails()])
    } catch (error) {
      console.error("Review submission error:", error)
      toast({
        title: "Error",
        description: "Failed to save review",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
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

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to favorite songs",
        variant: "destructive",
      })
      return
    }

    try {
      // Ensure song exists in database first
      if (song) {
        await supabase.from("songs").upsert({
          id: song.id,
          name: song.name,
          artist_name: song.artist_name,
          album_name: song.album_name,
          album_image_url: song.album_image_url,
          preview_url: song.preview_url,
          duration_ms: song.duration_ms,
          release_date: song.release_date,
          spotify_url: song.spotify_url,
        })
      }

      if (isFavorited) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("song_id", songId)
      } else {
        await supabase.from("favorites").insert({
          user_id: user.id,
          song_id: songId,
        })
      }

      setIsFavorited(!isFavorited)
      fetchSongDetails()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      })
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
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
          <p className="text-white text-lg">Loading song details...</p>
        </div>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">Song not found</h1>
          <p className="text-gray-400">The song you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Song Header */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-80">
            <div className="relative aspect-square rounded-3xl overflow-hidden group">
              <Image
                src={song.album_image_url || "/placeholder.svg?height=400&width=400&query=music album cover"}
                alt={`${song.album_name} cover`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

              {song.preview_url && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    size="icon"
                    className="rounded-full bg-white/90 hover:bg-white w-16 h-16"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{song.name}</h1>
              <p className="text-xl text-gray-300 mb-1">{song.artist_name}</p>
              <p className="text-lg text-gray-400">{song.album_name}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              {song.duration_ms && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(song.duration_ms)}
                </div>
              )}
              {song.release_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(song.release_date).getFullYear()}
                </div>
              )}
              {song.explicit && (
                <Badge variant="destructive" className="rounded-full">
                  Explicit
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <Badge variant="secondary" className="rounded-full">
                ⭐ {song.avg_rating?.toFixed(1) || "0.0"} ({song.total_ratings || 0} ratings)
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                <MessageCircle className="h-3 w-3 mr-1" />
                {song.total_reviews || 0} reviews
              </Badge>
              <Badge variant="secondary" className="rounded-full">
                <Heart className="h-3 w-3 mr-1" />
                {song.total_favorites || 0} favorites
              </Badge>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button onClick={toggleFavorite} variant={isFavorited ? "default" : "outline"} className="rounded-xl">
                <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
                {isFavorited ? "Favorited" : "Add to Favorites"}
              </Button>

              {song.spotify_url && (
                <Button variant="outline" className="rounded-xl bg-transparent" asChild>
                  <a href={song.spotify_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Spotify
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Rating Section */}
        {user && (
          <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Rate this song</CardTitle>
            </CardHeader>
            <CardContent>
              <StarRating rating={userRating} onRatingChange={handleRatingChange} size="lg" maxStars={5} />
            </CardContent>
          </Card>
        )}

        {/* Review Section */}
        {user && (
          <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Write a review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RichTextEditor
                value={userReview}
                onChange={(value) => setUserReview(value)}
                placeholder="Share your thoughts about this song..."
              />
              <Button
                onClick={handleReviewSubmit}
                disabled={!userReview.trim() || submitting}
                className="bg-red-600 hover:bg-red-700 rounded-xl"
              >
                {submitting ? "Publishing..." : "Publish Review"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Reviews ({reviews.length})</h2>

          {reviews.length === 0 ? (
            <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
              <CardContent className="py-12 text-center text-gray-400">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No reviews yet. Be the first to share your thoughts!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card
                  key={review.id}
                  className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 rounded-3xl backdrop-blur-sm"
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={review.profiles.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gray-700 text-white">
                          {review.profiles.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{review.profiles.username}</span>
                            <span className="text-sm text-gray-400">{formatTimeAgo(review.created_at)}</span>
                          </div>
                          {review.ratings && <StarRating rating={review.ratings.rating} readonly size="sm" />}
                        </div>

                        <div
                          className="text-gray-300 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: review.content
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\*(.*?)\*/g, "<em>$1</em>")
                              .replace(/\n/g, "<br>"),
                          }}
                        />

                        <div className="flex items-center gap-4 pt-2">
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
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
