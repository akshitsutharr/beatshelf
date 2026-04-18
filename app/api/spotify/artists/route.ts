import { type NextRequest, NextResponse } from "next/server"
import { getArtistsByIds, getFeaturedArtists } from "@/lib/spotify"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get("ids")

    if (idsParam) {
      const ids = idsParam
        .split(",")
        .map((id) => decodeURIComponent(id).trim())
        .filter(Boolean)

      const artists = await getArtistsByIds(ids)
      return NextResponse.json({ items: artists })
    }

    const limit = Number.parseInt(searchParams.get("limit") || "30")

    const artists = await getFeaturedArtists(limit)
    return NextResponse.json({ items: artists })
  } catch (error) {
    console.error("Artists error:", error)
    return NextResponse.json({ error: "Failed to load artists" }, { status: 500 })
  }
}
