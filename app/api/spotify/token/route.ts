import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

export async function GET() {
  try {
    const token = await getSpotifyToken()
    return NextResponse.json({ access_token: token })
  } catch (error) {
    console.error("Token API error:", error)

    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return NextResponse.json(
      {
        error: "Failed to get Spotify token",
        details: errorMessage,
      },
      { status: 500 },
    )
  }
}
