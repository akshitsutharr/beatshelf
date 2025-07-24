import { type NextRequest, NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const trackId = params.id

    if (!trackId) {
      return NextResponse.json({ error: "Track ID is required" }, { status: 400 })
    }

    const token = await getSpotifyToken()

    const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Track not found" }, { status: 404 })
      } else if (response.status === 401) {
        return NextResponse.json({ error: "Spotify authentication failed" }, { status: 401 })
      } else {
        const errorText = await response.text()
        return NextResponse.json(
          { error: `Spotify API error: ${response.status} ${response.statusText}`, details: errorText },
          { status: response.status },
        )
      }
    }

    const track = await response.json()
    return NextResponse.json(track)
  } catch (error) {
    console.error("Track fetch error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch track",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
