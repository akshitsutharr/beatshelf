import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const albumId = decodeURIComponent(id || "").replace(/^album:/, "")

    if (!albumId) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 })
    }

    const token = await getSpotifyToken()

    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Album not found on Spotify" }, { status: 404 })
      }
      throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
    }

    const album = await response.json()
    return NextResponse.json(album)
  } catch (error) {
    console.error("Error fetching album:", error)
    return NextResponse.json(
      { error: "Failed to fetch album" },
      { status: 500 }
    )
  }
}
