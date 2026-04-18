"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import { MessageSquareText, Clock, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { StarRating } from "@/components/ui/star-rating"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"

interface AlbumData {
  id: string
  name: string
  artists: Array<{ name: string; id: string }>
  images: Array<{ url: string }>
  release_date: string
  total_tracks: number
  label: string
  genres: string[]
  tracks: {
    items: Array<{
      id: string
      name: string
      artists: Array<{ name: string }>
      duration_ms: number
      track_number: number
      preview_url: string | null
    }>
  }
}

export default function AlbumPage() {
  const params = useParams()
  const router = useRouter()
  const albumId = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()

  const [album, setAlbum] = useState<AlbumData | null>(null)
  const [albumReviews, setAlbumReviews] = useState<Array<{ id: string; content: string; created_at: string; profiles: { username: string } }>>([])
  const [albumReview, setAlbumReview] = useState("")
  const [albumRating, setAlbumRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (albumId) {
      Promise.all([fetchAlbumDetails(), fetchAlbumReviews()])
    }
  }, [albumId])

  const fetchAlbumDetails = async () => {
    try {
      const response = await fetch(`/api/spotify/album/${albumId}`)
      if (!response.ok) throw new Error("Failed to fetch album")
      const data = await response.json()
      setAlbum(data)
    } catch (error) {
      console.error("Error fetching album:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAlbumReviews = async () => {
    try {
      const { data } = await supabase
        .from("reviews")
        .select(`
          id,
          content,
          created_at,
          profiles:user_id (username)
        `)
        .eq("song_id", `album:${albumId}`)
        .order("created_at", { ascending: false })
        .limit(10)

      const normalized = (data || []).map((item: any) => ({
        ...item,
        profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles,
      }))

      setAlbumReviews(normalized)
    } catch (error) {
      console.error("Error fetching album reviews:", error)
    }
  }

  const submitAlbumReview = async () => {
    if (!user || !album || !albumReview.trim()) {
      toast({ title: "Missing information", description: "Please add a rating and review.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          songId: `album:${album.id}`,
          song: {
            id: `album:${album.id}`,
            name: album.name,
            artist_name: album.artists.map((a) => a.name).join(", "),
            album_name: album.name,
            album_image_url: album.images[0]?.url,
            release_date: album.release_date,
            spotify_url: `https://open.spotify.com/album/${album.id}`,
          },
          content: albumReview,
          rating: albumRating,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        console.error("Album review API error payload:", payload)
        throw new Error(payload?.error || `Failed to publish review (${response.status})`)
      }

      toast({ title: "Album review published", description: "Your album review is now live." })
      setAlbumReview("")
      setAlbumRating(0)
      fetchAlbumReviews()
    } catch (error) {
      console.error("Error submitting album review:", error)
      toast({
        title: "Failed to publish",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatTotalDuration = () => {
    if (!album) return "0 mins"
    const totalMs = album.tracks.items.reduce((acc, track) => acc + track.duration_ms, 0)
    const totalMinutes = Math.floor(totalMs / 60000)
    const totalHours = Math.floor(totalMinutes / 60)
    if (totalHours > 0) {
       return `${totalHours} hr ${totalMinutes % 60} min`
    }
    return `${totalMinutes} mins`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    )
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Album not found</h1>
        <Button onClick={() => router.back()} variant="outline" className="text-white border-white/20">
          Go Back
        </Button>
      </div>
    )
  }

  const albumPrimaryImage = album.images[0]?.url || "/placeholder.svg?height=600&width=600"

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Blurred immersive background */}
      <div className="absolute inset-0 top-0 h-[60vh] overflow-hidden -z-10 bg-black">
        <Image
          src={albumPrimaryImage}
          alt={album.name}
          fill
          className="object-cover opacity-30 blur-[100px] scale-125 translate-y-[-10%]"
        />
        <div className="absolute inset-0 top-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl overflow-x-hidden">
        <Button 
          onClick={() => router.back()} 
          variant="ghost" 
          className="mb-6 hover:bg-white/10 text-white/50 hover:text-white rounded-full -ml-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Button>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-end mb-12 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-[280px] h-[280px] md:w-[320px] md:h-[320px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden shrink-0 relative"
          >
            <Image
              src={albumPrimaryImage}
              alt={album.name}
              fill
              className="object-cover"
            />
          </motion.div>

          <div className="flex-1 text-center md:text-left space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white drop-shadow-xl">{album.name}</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-red-500 drop-shadow-md">
              {album.artists.map(a => a.name).join(", ")}
            </h2>
            <div className="text-sm font-medium text-white/60 flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <span>{album.label}</span>
              <span>•</span>
              <span>{new Date(album.release_date).getFullYear()}</span>
              <span>•</span>
              <span>{album.total_tracks} songs, {formatTotalDuration()}</span>
            </div>
            
            <div className="flex items-center gap-3 justify-center md:justify-start pt-4 flex-wrap">
              <Button className="rounded-full bg-red-500 hover:bg-red-400 text-white font-bold h-12 px-8 shadow-xl hover:scale-105 transition-transform duration-300" asChild>
                <Link href="/write-review">
                  <MessageSquareText className="h-5 w-5 mr-2" />
                  Review Album
                </Link>
              </Button>
              <Button variant="outline" className="rounded-full border-white/30 bg-black/20 hover:bg-white/10 h-12 px-7" asChild>
                <Link href="/reviews">Read Community Reviews</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-1">
          <div className="grid grid-cols-[40px_1fr_60px] md:grid-cols-[60px_1fr_60px] gap-4 px-4 py-2 border-b border-white/5 text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
            <div className="text-right">#</div>
            <div>Title</div>
            <div className="flex items-center justify-end"><Clock className="w-4 h-4" /></div>
          </div>
          
          {album.tracks.items.map((track) => (
            <Link href={`/song/${track.id}`} key={track.id}>
              <div className="grid grid-cols-[40px_1fr_60px] md:grid-cols-[60px_1fr_60px] gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group items-center cursor-pointer overflow-hidden">
                <div className="text-right text-gray-400">
                  {track.track_number}
                </div>
                
                <div className="flex flex-col truncate">
                  <span className="font-medium text-white group-hover:text-red-400 transition-colors truncate">
                    {track.name}
                  </span>
                  <span className="text-sm text-gray-500 truncate">
                    {track.artists.map(a => a.name).join(", ")}
                  </span>
                  <span className="text-xs text-white/45 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Write track review
                  </span>
                </div>
                
                <div className="text-right text-sm text-gray-400">
                  {formatDuration(track.duration_ms)}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {user && (
          <Card className="mt-10 bg-[#0c0d12]/80 border-white/10 rounded-3xl backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Write an album review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-white/70 mb-2">Album rating</p>
                <StarRating rating={albumRating} onRatingChange={setAlbumRating} size="md" forceShowStars />
              </div>
              <RichTextEditor
                value={albumReview}
                onChange={setAlbumReview}
                placeholder="Share your overall thoughts on this album..."
              />
              <Button
                onClick={submitAlbumReview}
                disabled={submitting || !albumReview.trim()}
                className="rounded-xl bg-red-500 hover:bg-red-400 text-white"
              >
                {submitting ? "Publishing..." : "Publish Album Review"}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 space-y-4">
          <h3 className="text-2xl font-semibold">Album Reviews ({albumReviews.length})</h3>
          {albumReviews.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white/65">
              No album reviews yet. Be the first to review this album.
            </div>
          ) : (
            albumReviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-white">{review.profiles?.username || "Anonymous"}</p>
                  <p className="text-xs text-white/50">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-white/80 mt-3 line-clamp-5">{review.content}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
