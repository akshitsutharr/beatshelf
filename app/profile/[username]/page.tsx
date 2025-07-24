"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StarRating } from "@/components/ui/star-rating"
import { User, MessageCircle, Star, Calendar, Loader2, Settings } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

interface UserProfile {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  created_at: string
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

interface UserStats {
  totalReviews: number
  totalRatings: number
  totalFavorites: number
  averageRating: number
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user: currentUser } = useAuth()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<UserReview[]>([])
  const [ratings, setRatings] = useState<UserRating[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalReviews: 0,
    totalRatings: 0,
    totalFavorites: 0,
    averageRating: 0,
  })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (username) {
      fetchUserProfile()
    }
  }, [username])

  const fetchUserProfile = async () => {
    setLoading(true)
    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single()

      if (profileError || !profileData) {
        setNotFound(true)
        return
      }

      setProfile(profileData)

      // Fetch user reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select(`
          id,
          content,
          created_at,
          songs (id, name, artist_name, album_image_url)
        `)
        .eq("user_id", profileData.id)
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
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false })

      // Fetch favorites count
      const { count: favoritesCount } = await supabase
        .from("favorites")
        .select("*", { count: "exact" })
        .eq("user_id", profileData.id)

      // Add ratings to reviews
      const reviewsWithRatings: UserReview[] = []
      if (reviewsData) {
        for (const review of reviewsData) {
          const userRating = ratingsData?.find((r) => r.songs.id === review.songs.id)
          reviewsWithRatings.push({
            ...review,
            ratings: userRating ? { rating: userRating.rating } : undefined,
          })
        }
      }

      setReviews(reviewsWithRatings)
      setRatings(ratingsData || [])

      // Calculate stats
      const totalReviews = reviewsData?.length || 0
      const totalRatings = ratingsData?.length || 0
      const totalFavorites = favoritesCount || 0
      const averageRating = ratingsData?.length
        ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length
        : 0

      setStats({
        totalReviews,
        totalRatings,
        totalFavorites,
        averageRating,
      })
    } catch (error) {
      console.error("Error fetching user profile:", error)
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const isOwnProfile = currentUser && profile && currentUser.id === profile.id

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <User className="h-16 w-16 mx-auto text-gray-600" />
          <h1 className="text-2xl font-bold text-white">User not found</h1>
          <p className="text-gray-400">The profile you're looking for doesn't exist.</p>
          <Button className="bg-red-600 hover:bg-red-700 rounded-xl" asChild>
            <Link href="/">Go Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gray-700 text-white text-4xl">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">{profile.username}</h1>
                    {profile.full_name && <p className="text-xl text-gray-300 mt-1">{profile.full_name}</p>}
                  </div>

                  {profile.bio && <p className="text-gray-400 max-w-2xl">{profile.bio}</p>}

                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>

                  {isOwnProfile && (
                    <Button className="bg-red-600 hover:bg-red-700 rounded-xl" asChild>
                      <Link href="/settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-1 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
                    <div className="text-sm text-gray-400">Reviews</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.totalRatings}</div>
                    <div className="text-sm text-gray-400">Ratings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.totalFavorites}</div>
                    <div className="text-sm text-gray-400">Favorites</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{stats.averageRating.toFixed(1)}</div>
                    <div className="text-sm text-gray-400">Avg Rating</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800 rounded-2xl">
              <TabsTrigger value="reviews" className="data-[state=active]:bg-red-600 rounded-xl">
                Reviews ({stats.totalReviews})
              </TabsTrigger>
              <TabsTrigger value="ratings" className="data-[state=active]:bg-red-600 rounded-xl">
                Ratings ({stats.totalRatings})
              </TabsTrigger>
            </TabsList>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              {reviews.length === 0 ? (
                <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                  <CardContent className="py-12 text-center text-gray-400">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{isOwnProfile ? "You haven't" : `${profile.username} hasn't`} written any reviews yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <Card
                      key={review.id}
                      className="bg-gray-900/50 border-gray-800 hover:bg-gray-800/50 transition-all duration-300 rounded-3xl backdrop-blur-sm"
                    >
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-red-600/20 text-red-400 rounded-full">Review</Badge>
                            <span className="text-sm text-gray-400">{formatTimeAgo(review.created_at)}</span>
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
                                {review.ratings && (
                                  <div className="mt-2">
                                    <StarRating rating={review.ratings.rating} readonly size="sm" />
                                  </div>
                                )}
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
              {ratings.length === 0 ? (
                <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                  <CardContent className="py-12 text-center text-gray-400">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{isOwnProfile ? "You haven't" : `${profile.username} hasn't`} rated any songs yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ratings.map((rating) => (
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
