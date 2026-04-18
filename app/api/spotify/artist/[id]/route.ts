import { NextResponse } from "next/server"
import { getArtistProfile } from "@/lib/spotify"

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const artistId = decodeURIComponent(id || "")

    if (!artistId) {
      return NextResponse.json({ error: "Artist ID is required" }, { status: 400 })
    }

    const payload = await getArtistProfile(artistId)
    return NextResponse.json(payload)
  } catch (error) {
    console.error("Artist profile error:", error)
    return NextResponse.json({ error: "Failed to load artist profile" }, { status: 500 })
  }
}
