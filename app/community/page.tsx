"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, MessageCircle, Star, TrendingUp, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface CommunityActivity {
  id: string
  type: "review" | "rating" | "favorite"
  created_at: string
  user: {
    username: string
    avatar_url?: string
  }
  song: {
    id: string
    name: string
    artist_name: string
    album_image_url?: string
  }
  content?: string
  rating?: number
}

export default function CommunityPage() {
  const [activities, setActivities] = useState<CommunityActivity[]>([])
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommunityData()
  }, [])

  const fetchCommunityData = async () => {
    try {
      // Fetch recent reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select(`
          id,
          content,
          created_at,
          profiles (username, avatar_url),
          songs (id, name, artist_name, album_image_url)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      // Fetch recent ratings
      const { data: ratings } = await supabase
        .from("ratings")
        .select(`
          id,
          rating,
          created_at,
          profiles (username, avatar_url),
          songs (id, name, artist_name, album_image_url)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      // Combine and sort activities
      const allActivities: CommunityActivity[] = [
        ...(reviews || []).map((r) => ({
          id: r.id,
          type: "review" as const,
          created_at: r.created_at,
          user: r.profiles,
          song: r.songs,
          content: r.content,
        })),
        ...(ratings || []).map((r) => ({
          id: r.id,
          type: "rating" as const,
          created_at: r.created_at,
          user: r.profiles,
          song: r.songs,
          rating: r.rating,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setActivities(allActivities.slice(0, 20))

      // Fetch top contributors (users with most reviews)
      const { data: topContributors } = await supabase
        .from("profiles")
        .select(`
          username,
          avatar_url,
          reviews (count),
          ratings (count)
        `)
        .limit(10)

      if (topContributors) {
        const sortedUsers = topContributors
          .map((user) => ({
            ...user,
            total_activity: (user.reviews?.length || 0) + (user.ratings?.length || 0),
          }))
          .sort((a, b) => b.total_activity - a.total_activity)
          .slice(0, 5)

        setTopUsers(sortedUsers)
      }
    } catch (error) {
      console.error("Error fetching community data:", error)
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
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-1/4" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded" />
              ))}
            </div>
            <div className="space-y-4">
              <div className="h-64 bg-muted rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Users className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Community</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what the community is listening to, discover new music through reviews, and connect with fellow music
            lovers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="recent" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recent">Recent Activity</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="ratings">Ratings</TabsTrigger>
              </TabsList>

              <TabsContent value="recent" className="space-y-4">
                {activities.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No community activity yet. Be the first to rate or review a song!
                    </CardContent>
                  </Card>
                ) : (
                  activities.map((activity) => (
                    <Card key={`${activity.type}-${activity.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <Avatar>
                            <AvatarImage src={activity.user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{activity.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold">{activity.user.username}</span>
                              {activity.type === "review" && (
                                <Badge variant="secondary">
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  reviewed
                                </Badge>
                              )}
                              {activity.type === "rating" && (
                                <Badge variant="secondary">
                                  <Star className="h-3 w-3 mr-1" />
                                  rated {activity.rating}/10
                                </Badge>
                              )}
                              {activity.type === "favorite" && (
                                <Badge variant="secondary">
                                  <Heart className="h-3 w-3 mr-1" />
                                  favorited
                                </Badge>
                              )}
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(activity.created_at)}
                              </span>
                            </div>

                            <Link
                              href={`/song/${activity.song.id}`}
                              className="block hover:text-primary transition-colors"
                            >
                              <div className="font-medium">{activity.song.name}</div>
                              <div className="text-sm text-muted-foreground">{activity.song.artist_name}</div>
                            </Link>

                            {activity.content && (
                              <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded">{activity.content}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {activities
                  .filter((a) => a.type === "review")
                  .map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <Avatar>
                            <AvatarImage src={activity.user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{activity.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{activity.user.username}</span>
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(activity.created_at)}
                              </span>
                            </div>

                            <Link
                              href={`/song/${activity.song.id}`}
                              className="block hover:text-primary transition-colors"
                            >
                              <div className="font-medium">{activity.song.name}</div>
                              <div className="text-sm text-muted-foreground">{activity.song.artist_name}</div>
                            </Link>

                            <p className="text-sm leading-relaxed">{activity.content}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>

              <TabsContent value="ratings" className="space-y-4">
                {activities
                  .filter((a) => a.type === "rating")
                  .map((activity) => (
                    <Card key={activity.id}>
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <Avatar>
                            <AvatarImage src={activity.user.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback>{activity.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{activity.user.username}</span>
                              <Badge variant="secondary">
                                <Star className="h-3 w-3 mr-1" />
                                {activity.rating}/10
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {formatTimeAgo(activity.created_at)}
                              </span>
                            </div>

                            <Link
                              href={`/song/${activity.song.id}`}
                              className="block hover:text-primary transition-colors"
                            >
                              <div className="font-medium">{activity.song.name}</div>
                              <div className="text-sm text-muted-foreground">{activity.song.artist_name}</div>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topUsers.map((user, index) => (
                  <div key={user.username} className="flex items-center gap-3">
                    <div className="text-sm font-bold text-muted-foreground w-6">#{index + 1}</div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{user.username}</div>
                      <div className="text-xs text-muted-foreground">{user.total_activity} contributions</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Community Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm">Total Reviews</span>
                  <span className="font-semibold">{activities.filter((a) => a.type === "review").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Ratings</span>
                  <span className="font-semibold">{activities.filter((a) => a.type === "rating").length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Active Users</span>
                  <span className="font-semibold">{topUsers.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
