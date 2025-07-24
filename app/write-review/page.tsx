"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StarRating } from "@/components/ui/star-rating"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Badge } from "@/components/ui/badge"
import { Search, Star, PenTool } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

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
}

export default function WriteReviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const songId = searchParams.get("song")
  const { user } = useAuth()
  const { toast } = useToast()

  const [selectedSong, setSelectedSong] = useState<Song | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Song[]>([])
  const [rating, setRating] = useState(0)
  const [reviewContent, setReviewContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin")
      return
    }

    if (songId) {
      fetchSongDetails(songId)
    }
  }, [user, songId])

  const fetchSongDetails = async (id: string) => {
    try {
      // First try to get from our database
      const { data: dbSong } = await supabase.from("songs").select("*").eq("id", id).single()

      if (dbSong) {
        setSelectedSong(dbSong)
      } else {
        // Fetch from Spotify API
        const response = await fetch(`/api/spotify/search?q=track:${id}`)
        const data = await response.json()

        if (data.tracks?.items?.[0]) {
          const track = data.tracks.items[0]
          const formattedSong = {
            id: track.id,
            name: track.name,
            artist_name: track.artists.map((a: any) => a.name).join(", "),
            album_name: track.album.name,
            album_image_url: track.album.images[0]?.url,
            preview_url: track.preview_url,
            duration_ms: track.duration_ms,
            release_date: track.album.release_date,
            spotify_url: track.external_urls.spotify,
          }
          setSelectedSong(formattedSong)
        }
      }
    } catch (error) {
      console.error("Error fetching song:", error)
    }
  }

  const searchSongs = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.tracks?.items) {
        const formattedTracks = data.tracks.items.slice(0, 10).map((track: any) => ({
          id: track.id,
          name: track.name,
          artist_name: track.artists.map((a: any) => a.name).join(", "),
          album_name: track.album.name,
          album_image_url: track.album.images[0]?.url,
          preview_url: track.preview_url,
          duration_ms: track.duration_ms,
          release_date: track.album.release_date,
          spotify_url: track.external_urls.spotify,
        }))
        setSearchResults(formattedTracks)
      }
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedSong || !rating || !reviewContent.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a song, provide a rating, and write a review",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // First, ensure the song is in our database
      await supabase.from("songs").upsert(selectedSong)

      // Save the rating
      await supabase.from("ratings").upsert({
        user_id: user!.id,
        song_id: selectedSong.id,
        rating,
      })

      // Save the review
      await supabase.from("reviews").upsert({
        user_id: user!.id,
        song_id: selectedSong.id,
        content: reviewContent.trim(),
      })

      toast({
        title: "Review published!",
        description: "Your review has been shared with the community",
      })

      router.push(`/song/${selectedSong.id}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to publish review",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <PenTool className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Write a Review
              </h1>
            </div>
            <p className="text-xl text-muted-foreground">Share your thoughts about a song with the community</p>
          </div>

          {/* Song Selection */}
          {!selectedSong && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Find a Song to Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for songs, artists, or albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && searchSongs()}
                  />
                  <Button onClick={searchSongs} disabled={searching}>
                    {searching ? "Searching..." : "Search"}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setSelectedSong(song)}
                      >
                        <Image
                          src={song.album_image_url || "/placeholder.svg?height=60&width=60&query=album cover"}
                          alt={song.name}
                          width={60}
                          height={60}
                          className="rounded-lg"
                        />
                        <div className="flex-1">
                          <div className="font-semibold">{song.name}</div>
                          <div className="text-sm text-muted-foreground">{song.artist_name}</div>
                          <div className="text-xs text-muted-foreground">{song.album_name}</div>
                        </div>
                        {song.duration_ms && (
                          <div className="text-sm text-muted-foreground">{formatDuration(song.duration_ms)}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Selected Song */}
          {selectedSong && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Reviewing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Image
                    src={selectedSong.album_image_url || "/placeholder.svg?height=100&width=100&query=album cover"}
                    alt={selectedSong.name}
                    width={100}
                    height={100}
                    className="rounded-lg shadow-md"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedSong.name}</h3>
                    <p className="text-lg text-muted-foreground">{selectedSong.artist_name}</p>
                    <p className="text-muted-foreground">{selectedSong.album_name}</p>
                    {selectedSong.release_date && (
                      <Badge variant="secondary" className="mt-2">
                        {new Date(selectedSong.release_date).getFullYear()}
                      </Badge>
                    )}
                  </div>
                  <Button variant="outline" onClick={() => setSelectedSong(null)}>
                    Change Song
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating */}
          {selectedSong && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Rate this Song
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>How would you rate this song?</Label>
                  <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Content */}
          {selectedSong && (
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Write Your Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Share your thoughts about this song</Label>
                  <RichTextEditor
                    value={reviewContent}
                    onChange={setReviewContent}
                    placeholder="What did you think of this song? Share your thoughts about the lyrics, production, vocals, or anything else that stood out to you..."
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          {selectedSong && (
            <div className="flex justify-center">
              <Button
                size="lg"
                onClick={handleSubmit}
                disabled={loading || !rating || !reviewContent.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {loading ? "Publishing..." : "Publish Review"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
