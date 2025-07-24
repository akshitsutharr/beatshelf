"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, BarChart3, Heart, Settings, MessageCircle, ChevronRight, Music, TrendingUp, Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"

interface UserPanelProps {
  isVisible: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function UserPanel({ isVisible, onMouseEnter, onMouseLeave }: UserPanelProps) {
  const { user, profile } = useAuth()
  const pathname = usePathname()
  const [stats, setStats] = useState({ reviews: 0, favorites: 0, ratings: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile) {
      fetchUserStats()
    }
  }, [user, profile])

  const fetchUserStats = async () => {
    try {
      const [reviewsResult, favoritesResult, ratingsResult] = await Promise.allSettled([
        supabase.from("reviews").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("user_likes").select("id", { count: "exact" }).eq("user_id", user?.id),
        supabase.from("ratings").select("id", { count: "exact" }).eq("user_id", user?.id),
      ])

      setStats({
        reviews: reviewsResult.status === "fulfilled" ? reviewsResult.value.count || 0 : 0,
        favorites: favoritesResult.status === "fulfilled" ? favoritesResult.value.count || 0 : 0,
        ratings: ratingsResult.status === "fulfilled" ? ratingsResult.value.count || 0 : 0,
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !profile) return null

  const menuItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
      description: "Your activity overview",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Profile",
      href: `/profile/${profile.username}`,
      icon: User,
      description: "View your public profile",
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Favorites",
      href: "/favorites",
      icon: Heart,
      description: "Your liked songs",
      color: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Write Review",
      href: "/write-review",
      icon: MessageCircle,
      description: "Share your thoughts",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Settings",
      href: "/settings",
      icon: Settings,
      description: "Account preferences",
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
    },
  ]

  const quickActions = [
    { title: "Search Music", href: "/search", icon: Search, color: "bg-red-600 hover:bg-red-700" },
    { title: "Trending", href: "/trending", icon: TrendingUp, color: "bg-gray-700 hover:bg-gray-600" },
    { title: "Explore", href: "/explore", icon: Music, color: "bg-purple-600 hover:bg-purple-700" },
  ]

  return (
    <div
      className={cn(
        "fixed right-4 top-16 z-50 w-80 max-w-[calc(100vw-2rem)]",
        "transition-all duration-300 ease-in-out transform",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none",
        "sm:w-72 md:w-80 lg:w-96",
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Card className="bg-gray-900/98 border-gray-700 rounded-3xl backdrop-blur-xl shadow-2xl border">
        <CardContent className="p-0">
          {/* Scrollable Content */}
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="text-center space-y-3">
                <Avatar className="h-16 w-16 mx-auto ring-2 ring-red-600/20">
                  <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gray-700 text-white text-xl font-bold">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-white text-lg">{profile.username}</h3>
                  <p className="text-gray-400 text-sm truncate">{user.email}</p>
                </div>
                <Badge className="bg-red-600/20 text-red-400 rounded-full border-red-600/30">Music Enthusiast</Badge>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                  <div className="text-lg font-bold text-white">{loading ? "..." : stats.reviews}</div>
                  <div className="text-xs text-gray-400">Reviews</div>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                  <div className="text-lg font-bold text-white">{loading ? "..." : stats.favorites}</div>
                  <div className="text-xs text-gray-400">Favorites</div>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-2xl border border-gray-700/50">
                  <div className="text-lg font-bold text-white">{loading ? "..." : stats.ratings}</div>
                  <div className="text-xs text-gray-400">Ratings</div>
                </div>
              </div>

              {/* Navigation Menu */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">Quick Access</h4>
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 group",
                          "hover:scale-[1.02] active:scale-[0.98]",
                          isActive
                            ? "bg-red-600/20 text-red-400 border border-red-600/30 shadow-lg shadow-red-600/10"
                            : "hover:bg-gray-800/70 text-gray-300 hover:text-white border border-transparent hover:border-gray-700/50",
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                            isActive ? "bg-red-600/30 shadow-lg" : `${item.bgColor} group-hover:scale-110`,
                          )}
                        >
                          <item.icon className={cn("w-5 h-5", isActive ? "text-red-400" : item.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-gray-500 truncate">{item.description}</div>
                        </div>
                        <ChevronRight
                          className={cn(
                            "w-4 h-4 transition-all duration-200 group-hover:translate-x-1",
                            isActive ? "text-red-400" : "text-gray-500",
                          )}
                        />
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">Quick Actions</h4>
                <div className="grid grid-cols-1 gap-2">
                  {quickActions.map((action) => (
                    <Button
                      key={action.href}
                      size="sm"
                      className={cn(
                        action.color,
                        "rounded-xl text-sm font-medium h-10 justify-start gap-3 transition-all duration-200",
                        "hover:scale-[1.02] active:scale-[0.98] shadow-lg",
                      )}
                      asChild
                    >
                      <Link href={action.href}>
                        <action.icon className="w-4 h-4" />
                        {action.title}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-700/50">
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Welcome back, <span className="text-red-400 font-medium">{profile.username}</span>!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
