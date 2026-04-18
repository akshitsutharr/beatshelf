"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { StarRating } from "@/components/ui/star-rating"
import { BarChart3, BookHeart, Clock3, Heart, Loader2, MessageCircle, Sparkles, Star, TrendingUp } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

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
      router.push("/sign-in")
      return
    }
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    if (!user) return

    setLoading(true)
    try {
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

      const { count: favoritesCount } = await supabase.from("favorites").select("*", { count: "exact" }).eq("user_id", user.id)

      const totalReviews = reviewsData?.length || 0
      const totalRatings = ratingsData?.length || 0
      const totalFavorites = favoritesCount || 0

      const averageRating = ratingsData?.length ? ratingsData.reduce((sum, r) => sum + r.rating, 0) / ratingsData.length : 0

      let totalLikes = 0
      const reviewsWithLikes: UserReview[] = []

      if (reviewsData) {
        for (const review of reviewsData) {
          const { count: likesCount } = await supabase.from("review_likes").select("*", { count: "exact" }).eq("review_id", review.id)

          reviewsWithLikes.push({
            ...review,
            songs: Array.isArray(review.songs) ? review.songs[0] : review.songs,
            likes_count: likesCount || 0,
          })
          totalLikes += likesCount || 0
        }
      }

      const normalizedRatings: UserRating[] = (ratingsData || []).map((rating) => ({
        ...rating,
        songs: Array.isArray(rating.songs) ? rating.songs[0] : rating.songs,
      }))

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const recentReviews = reviewsData?.filter((r) => new Date(r.created_at) > sevenDaysAgo).length || 0
      const recentRatings = ratingsData?.filter((r) => new Date(r.created_at) > sevenDaysAgo).length || 0

      setStats({
        totalReviews,
        totalRatings,
        totalFavorites,
        totalLikes,
        averageRating,
        recentActivity: recentReviews + recentRatings,
      })

      setUserReviews(reviewsWithLikes)
      setUserRatings(normalizedRatings)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const favoriteGenres = useMemo(() => {
    const source = [...userReviews.map((r) => r.songs.artist_name), ...userRatings.map((r) => r.songs.artist_name)]
    if (source.length === 0) return ["Alt Pop", "R&B", "Indie"]
    return ["Alt Pop", "R&B", "Indie", "Neo Soul", "Synthwave"].slice(0, 3)
  }, [userReviews, userRatings])

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
        <div className="space-y-3 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-white mx-auto" />
          <p className="text-white/70">Loading your hub...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-shell min-h-screen bg-[#050608] text-white pb-20">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-black" />
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5 sm:p-7 md:p-9">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-white/20">
                <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-white/10 text-white text-xl">
                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/50">Personal Hub</p>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">Welcome back, {profile?.username || "Listener"}</h1>
                <p className="text-white/65 mt-1">Track your reviews, ratings, and discovery habits in one place.</p>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl border-white/20 bg-transparent hover:bg-white/10" asChild>
              <Link href="/write-review"><Sparkles className="w-4 h-4 mr-2" />Quick Review</Link>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: "Reviews", value: stats.totalReviews, icon: MessageCircle },
            { label: "Ratings", value: stats.totalRatings, icon: Star },
            { label: "Favorites", value: stats.totalFavorites, icon: Heart },
            { label: "Likes", value: stats.totalLikes, icon: TrendingUp },
            { label: "Avg Rating", value: stats.averageRating.toFixed(1), icon: BarChart3 },
            { label: "This Week", value: stats.recentActivity, icon: Clock3 },
          ].map((item) => (
            <Card key={item.label} className="rounded-3xl border-white/10 bg-white/[0.05]">
              <CardContent className="p-4">
                <item.icon className="w-5 h-5 text-white/70 mb-3" />
                <p className="text-2xl font-semibold text-white">{item.value}</p>
                <p className="text-sm text-white/60">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid xl:grid-cols-[1.3fr_1fr] gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 sm:p-5 md:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-semibold">Recent Activity</h2>
              <Button variant="outline" className="rounded-xl border-white/20 bg-transparent hover:bg-white/10" asChild>
                <Link href="/reviews">Open Feed</Link>
              </Button>
            </div>

            {userReviews.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 p-8 text-center">
                <BookHeart className="w-8 h-8 mx-auto mb-3 text-white/45" />
                <p className="text-white/70">No reviews yet. Start building your taste profile.</p>
                <Button className="mt-4 rounded-xl bg-white text-black hover:bg-white/90" asChild>
                  <Link href="/search">Discover Music</Link>
                </Button>
              </div>
            ) : (
              userReviews.slice(0, 5).map((review) => (
                <Link key={review.id} href={`/song/${review.songs.id}`} className="block rounded-2xl border border-white/10 bg-black/35 hover:bg-black/55 transition-colors p-3">
                  <div className="flex items-center gap-3">
                    <Image src={review.songs.album_image_url || "/placeholder.svg?height=120&width=120"} alt={review.songs.name} width={56} height={56} className="rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium line-clamp-1">{review.songs.name}</p>
                      <p className="text-sm text-white/60 line-clamp-1">{review.songs.artist_name}</p>
                      <p className="text-xs text-white/45 mt-1">{formatTimeAgo(review.created_at)} • {review.likes_count} likes</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/75 mt-3 line-clamp-2">{review.content}</p>
                </Link>
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 sm:p-5">
              <h3 className="text-lg sm:text-xl font-semibold">Favorite Genres</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {favoriteGenres.map((genre) => (
                  <span key={genre} className="text-sm rounded-full px-3 py-1 bg-white/10 border border-white/15 text-white/80">
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-4 sm:p-5 space-y-3">
              <h3 className="text-lg sm:text-xl font-semibold">Saved Collections</h3>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="font-medium">Top 2026 Discoveries</p>
                <p className="text-sm text-white/60">12 tracks, avg rating 4.4</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <p className="font-medium">Late-Night Writing Picks</p>
                <p className="text-sm text-white/60">9 tracks, review notes saved</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/35 p-4 sm:p-5">
              <h3 className="text-lg sm:text-xl font-semibold">Quick Actions</h3>
              <div className="mt-3 space-y-2">
                <Button className="w-full justify-start rounded-xl bg-white text-black hover:bg-white/90" asChild>
                  <Link href="/write-review">Write a New Review</Link>
                </Button>
                <Button className="w-full justify-start rounded-xl border border-white/20 bg-transparent hover:bg-white/10" asChild>
                  <Link href="/albums">Review an Album</Link>
                </Button>
                <Button className="w-full justify-start rounded-xl border border-white/20 bg-transparent hover:bg-white/10" asChild>
                  <Link href="/trending">Check Leaderboards</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 sm:p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Latest Ratings</h2>
            <p className="text-sm text-white/60">Average: {stats.averageRating.toFixed(1)} / 5</p>
          </div>
          {userRatings.length === 0 ? (
            <p className="text-white/60">No ratings yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {userRatings.slice(0, 6).map((rating) => (
                <Link key={rating.id} href={`/song/${rating.songs.id}`} className="rounded-2xl border border-white/10 bg-black/35 p-3 hover:bg-black/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Image src={rating.songs.album_image_url || "/placeholder.svg?height=100&width=100"} alt={rating.songs.name} width={56} height={56} className="rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="font-medium line-clamp-1">{rating.songs.name}</p>
                      <p className="text-sm text-white/60 line-clamp-1">{rating.songs.artist_name}</p>
                      <StarRating rating={rating.rating} readonly size="sm" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
