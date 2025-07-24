import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

const GENRES = [
  "pop",
  "rock",
  "hip-hop",
  "electronic",
  "jazz",
  "classical",
  "country",
  "r&b",
  "indie",
  "alternative",
  "dance",
  "latin",
  "reggae",
  "blues",
  "folk",
  "punk",
]

const RANDOM_QUERIES = [
  "year:2023",
  "year:2022",
  "year:2021",
  "year:2020",
  "year:2019",
  "genre:pop",
  "genre:rock",
  "genre:hip-hop",
  "genre:electronic",
  "a",
  "e",
  "i",
  "o",
  "u",
  "the",
  "love",
  "night",
  "day",
  "life",
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const genre = searchParams.get("genre")

    const token = await getSpotifyToken()
    const allTracks: any[] = []

    // If genre is specified, search by genre
    if (genre) {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=50&offset=${Math.floor(Math.random() * 1000)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (response.ok) {
        const data = await response.json()
        allTracks.push(...data.tracks.items)
      }
    } else {
      // Fetch random songs using multiple queries
      const queries = RANDOM_QUERIES.sort(() => 0.5 - Math.random()).slice(0, 5)

      for (const query of queries) {
        try {
          const offset = Math.floor(Math.random() * 1000)
          const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20&offset=${offset}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          )

          if (response.ok) {
            const data = await response.json()
            allTracks.push(...data.tracks.items)
          }
        } catch (error) {
          console.error(`Error fetching for query ${query}:`, error)
        }
      }
    }

    // Remove duplicates and shuffle
    const uniqueTracks = allTracks
      .filter((track, index, self) => track && track.id && index === self.findIndex((t) => t && t.id === track.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, limit)

    return NextResponse.json({ tracks: uniqueTracks })
  } catch (error) {
    console.error("Random songs API error:", error)
    return NextResponse.json({ error: "Failed to fetch random songs" }, { status: 500 })
  }
}
