"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Settings, User, Bell, Shield, Download, Trash2, Save, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    username: "",
    full_name: "",
    bio: "",
    avatar_url: "",
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    publicProfile: true,
    showActivity: true,
    darkMode: true,
  })

  const [stats, setStats] = useState({
    totalReviews: 0,
    totalRatings: 0,
    totalFavorites: 0,
    joinDate: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin")
      return
    }
    loadUserData()
  }, [user, profile])

  const loadUserData = async () => {
    if (!user || !profile) return

    setProfileData({
      username: profile.username || "",
      full_name: profile.full_name || "",
      bio: profile.bio || "",
      avatar_url: profile.avatar_url || "",
    })

    // Load user stats
    try {
      const [reviewsRes, ratingsRes, favoritesRes] = await Promise.all([
        supabase.from("reviews").select("*", { count: "exact" }).eq("user_id", user.id),
        supabase.from("ratings").select("*", { count: "exact" }).eq("user_id", user.id),
        supabase.from("favorites").select("*", { count: "exact" }).eq("user_id", user.id),
      ])

      setStats({
        totalReviews: reviewsRes.count || 0,
        totalRatings: ratingsRes.count || 0,
        totalFavorites: favoritesRes.count || 0,
        joinDate: new Date(user.created_at).toLocaleDateString(),
      })
    } catch (error) {
      console.error("Error loading user stats:", error)
    }
  }

  const handleProfileUpdate = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will remove all your reviews, ratings, and favorites.",
    )

    if (!confirmed) return

    setLoading(true)
    try {
      // Delete user data (cascade will handle related records)
      const { error } = await supabase.from("profiles").delete().eq("id", user.id)

      if (error) throw error

      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted",
      })

      // Sign out and redirect
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Fetch all user data
      const [reviews, ratings, favorites] = await Promise.all([
        supabase.from("reviews").select("*, songs(*)").eq("user_id", user.id),
        supabase.from("ratings").select("*, songs(*)").eq("user_id", user.id),
        supabase.from("favorites").select("*, songs(*)").eq("user_id", user.id),
      ])

      const userData = {
        profile: profileData,
        stats,
        reviews: reviews.data || [],
        ratings: ratings.data || [],
        favorites: favorites.data || [],
        exportDate: new Date().toISOString(),
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `beatshelf-data-${profileData.username}-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: "Data exported",
        description: "Your data has been downloaded as a JSON file",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Settings className="h-8 w-8 text-red-600" />
              <h1 className="text-3xl md:text-4xl font-bold text-white">Settings</h1>
            </div>
            <p className="text-gray-400">Manage your account and preferences</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-gray-700 text-white text-2xl">
                        {profileData.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label htmlFor="avatar_url">Avatar URL</Label>
                      <Input
                        id="avatar_url"
                        value={profileData.avatar_url}
                        onChange={(e) => setProfileData({ ...profileData, avatar_url: e.target.value })}
                        placeholder="https://example.com/avatar.jpg"
                        className="bg-gray-800 border-gray-700 text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={profileData.username}
                        onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white rounded-xl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        className="bg-gray-800 border-gray-700 text-white rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="bg-gray-800 border-gray-700 text-white rounded-xl"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleProfileUpdate}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 rounded-xl"
                  >
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-gray-400">Receive email updates about your activity</p>
                      </div>
                      <Switch
                        checked={preferences.emailNotifications}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, emailNotifications: checked })}
                      />
                    </div>

                    <Separator className="bg-gray-700" />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Public Profile</Label>
                        <p className="text-sm text-gray-400">Allow others to view your profile</p>
                      </div>
                      <Switch
                        checked={preferences.publicProfile}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, publicProfile: checked })}
                      />
                    </div>

                    <Separator className="bg-gray-700" />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Activity</Label>
                        <p className="text-sm text-gray-400">Display your reviews and ratings publicly</p>
                      </div>
                      <Switch
                        checked={preferences.showActivity}
                        onCheckedChange={(checked) => setPreferences({ ...preferences, showActivity: checked })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data & Privacy */}
              <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Data & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={exportData}
                      disabled={loading}
                      variant="outline"
                      className="border-gray-600 text-gray-300 bg-transparent rounded-xl hover:bg-gray-800"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export My Data
                    </Button>

                    <Button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      variant="destructive"
                      className="rounded-xl"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400">
                    Export your data or permanently delete your account and all associated data.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Account Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalReviews}</div>
                    <div className="text-sm text-gray-400">Reviews Written</div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalRatings}</div>
                    <div className="text-sm text-gray-400">Songs Rated</div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats.totalFavorites}</div>
                    <div className="text-sm text-gray-400">Favorites</div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div className="text-center">
                    <div className="text-sm text-gray-400">Member Since</div>
                    <div className="font-semibold text-white">{stats.joinDate}</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-800 rounded-3xl backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Account Type</span>
                    <Badge className="bg-red-600/20 text-red-400 rounded-full">Free</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Status</span>
                    <Badge className="bg-green-600/20 text-green-400 rounded-full">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Email</span>
                    <Badge className="bg-blue-600/20 text-blue-400 rounded-full">Verified</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
