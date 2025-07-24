"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarRating } from "@/components/ui/star-rating"
import { BarChart3, Heart, MessageCircle, Star, TrendingUp, ThumbsUp, Clock, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface UserStats {
  totalReviews: number
  totalRatings: number
  totalFavorites: number
  totalLikes: number
  averageRating: number
  recentActivity: number
}

interface UserReview {
  id: string
  content: string
  created_at: string
  songs: {
    id: string
    name: string
    artist_name: string
    album_image_url?: string
  }
  ratings?: {
    rating: number
  }
  likes_count: number
}

interface UserRating {
  id: string
  rating: number
  created_at: string
  songs: {
    id: string
    name: string
    artist_name: string
    album_image_url?: string
  }
}

export default function DashboardPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats>({
    totalReviews: 0,
    totalRatings: 0,
    totalFavorites: 0,
    totalLikes: 0,
    averageRating: 0,
    recentActivity: 0,
  })
  const [userReviews, setUserReviews] = useState<UserReview[]>([])
  const [userRatings, setUserRatings] = useState<UserRating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin")
      return
    }
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch user reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          id,
          content,
          created_at,
          songs (id, name, artist_name, album_image_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Fetch user ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select(`
          id,
          rating,
          created_at,
          songs (id, name, artist_name, album_image_url)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      // Fetch favorites count
      const { count: favoritesCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)

      // Calculate stats
      const totalReviews = reviewsData?.length || 0
      const totalRatings = ratingsData?.length || 0
      const totalFavorites = favoritesCount || 0

      const averageRating = ratingsData?.length
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
        : 0

      // Get likes count for user's reviews
      let totalLikes = 0
      const reviewsWithLikes: UserReview[] = []

      if (reviewsData) {
        for (const review of reviewsData) {
          const { count: likesCount } = await supabase
            .from("review_likes")
            .select("*", { count: "exact" })
            .eq("review_id", review.id)

          reviewsWithLikes.push({
            ...review,
            likes_count: likesCount || 0,
          })
          totalLikes += likesCount || 0
        }
      }

      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const recentReviews = reviewsData?.filter((r) => new Date(r.created_at) > sevenDaysAgo).length || 0
      const recentRatings = ratingsData?.filter((r) => new Date(r.created_at) > sevenDaysAgo).length || 0
      const recentActivity = recentReviews + recentRatings

      setStats({
        totalReviews,
        totalRatings,
        totalFavorites,
        totalLikes,
        averageRating,
        recentActivity,
      })

      setUserReviews(reviewsWithLikes)
      setUserRatings(ratingsData || [])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
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
          <p className="text-white text-lg">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-gray-700 text-white text-xl">
                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome back, {profile?.username}!</h1>
                <p className="text-gray-400">Here's your music activity overview</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-red-600" />
              <span className="text-xl font-semibold">Dashboard</span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
                <div className="text-sm text-gray-400">Reviews</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalRatings}</div>
                <div className="text-sm text-gray-400">Ratings</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalFavorites}</div>
                <div className="text-sm text-gray-400">Favorites</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <ThumbsUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.totalLikes}</div>
                <div className="text-sm text-gray-400">Likes Received</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-gray-400">Avg Rating</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{stats.recentActivity}</div>
                <div className="text-sm text-gray-400">This Week</div>
              </CardContent>
            </Card>
          </div>

          {/* Content Tabs */}
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800 rounded-2xl">
              <TabsTrigger value="reviews" className="data-[state=active]:bg-red-600 rounded-xl">
                My Reviews ({stats.totalReviews})
              </TabsTrigger>
              <TabsTrigger value="ratings" className="data-[state=active]:bg-red-600 rounded-xl">
                My Ratings ({stats.totalRatings})
              </TabsTrigger>
            </TabsList>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">Your Reviews</h2>
                <Button className="bg-red-600 hover:bg-red-700 rounded-xl" asChild>
                  <Link href="/write-review">Write New Review</Link>
                </Button>
              </div>

              {userReviews.length === 0 ? (
                <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                  <CardContent className="py-12 text-center text-gray-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>You haven't written any reviews yet.</p>
                    <Button className="mt-4 bg-red-600 hover:bg-red-700 rounded-xl" asChild>
                      <Link href="/search">Find Music to Review</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {userReviews.map((review) => (
                    <Card
                      key={review.id}
                      className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 rounded-3xl backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-red-600/20 text-red-400 rounded-full">Review</Badge>
                              <span className="text-sm text-gray-400">{formatTimeAgo(review.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <ThumbsUp className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-400">{review.likes_count}</span>
                            </div>
                          </div>

                          <Link href={`/song/${review.songs.id}`} className="block">
                            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-800/50 hover:bg-gray-700/50 transition-colors">
                              <Image
                                src={review.songs.album_image_url || "/placeholder.svg?height=60&width=60"}
                                alt={review.songs.name}
                                width={60}
                                height={60}
                                className="rounded-xl"
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-white">{review.songs.name}</h3>
                                <p className="text-gray-400">{review.songs.artist_name}</p>
                              </div>
                            </div>
                          </Link>

                          <div className="text-gray-300 leading-relaxed">{review.content}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Ratings Tab */}
            <TabsContent value="ratings" className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-white">Your Ratings</h2>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-white">Average: {stats.averageRating.toFixed(1)}/5</span>
                </div>
              </div>

              {userRatings.length === 0 ? (
                <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                  <CardContent className="py-12 text-center text-gray-400">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>You haven't rated any songs yet.</p>
                    <Button className="mt-4 bg-red-600 hover:bg-red-700 rounded-xl" asChild>
                      <Link href="/search">Find Music to Rate</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userRatings.map((rating) => (
                    <Card
                      key={rating.id}
                      className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 rounded-3xl backdrop-blur-sm"
                    >
                      <CardContent className="p-4">
                        <Link href={`/song/${rating.songs.id}`} className="block space-y-3">
                          <div className="relative aspect-square rounded-2xl overflow-hidden">
                            <Image
                              src={rating.songs.album_image_url || "/placeholder.svg?height=200&width=200"}
                              alt={rating.songs.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-white line-clamp-1">{rating.songs.name}</h3>
                            <p className="text-sm text-gray-400 line-clamp-1">{rating.songs.artist_name}</p>
                            <div className="flex items-center justify-between">
                              <StarRating rating={rating.rating} readonly size="sm" />
                              <span className="text-xs text-gray-500">{formatTimeAgo(rating.created_at)}</span>
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
