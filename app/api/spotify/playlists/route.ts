import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

export async function GET() {
  try {
    const token = await getSpotifyToken()

    // Get featured playlists
    const response = await fetch("https://api.spotify.com/v1/browse/featured-playlists?limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch playlists")
    }

    const data = await response.json()
    return NextResponse.json({ playlists: data.playlists.items })
  } catch (error) {
    console.error("Playlists API error:", error)
    return NextResponse.json({ error: "Failed to fetch playlists" }, { status: 500 })
  }
}
