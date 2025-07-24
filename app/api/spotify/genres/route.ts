import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

export async function GET() {
  try {
    const token = await getSpotifyToken()

    const response = await fetch("https://api.spotify.com/v1/recommendations/available-genre-seeds", {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch genres")
    }

    const data = await response.json()
    return NextResponse.json({ genres: data.genres })
  } catch (error) {
    console.error("Genres API error:", error)
    return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 })
  }
}
