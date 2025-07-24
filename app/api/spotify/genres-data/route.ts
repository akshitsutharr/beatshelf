import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

const GENRE_MAPPING = {
  pop: ["pop", "dance-pop", "electropop"],
  rock: ["rock", "alternative", "indie-rock"],
  "hip-hop": ["hip-hop", "rap", "trap"],
  electronic: ["electronic", "house", "techno"],
  jazz: ["jazz", "smooth-jazz", "jazz-fusion"],
  classical: ["classical", "orchestral", "chamber-music"],
  country: ["country", "bluegrass", "folk"],
  "r&b": ["r-n-b", "soul", "funk"],
  indie: ["indie", "indie-pop", "indie-rock"],
  latin: ["latin", "reggaeton", "salsa"],
  reggae: ["reggae", "dancehall", "dub"],
  blues: ["blues", "electric-blues", "delta-blues"],
}

export async function GET() {
  try {
    const token = await getSpotifyToken()
    const genreData: Record<string, any[]> = {}

    // Fetch songs for each genre
    for (const [mainGenre, subGenres] of Object.entries(GENRE_MAPPING)) {
      const tracks: any[] = []

      // Try multiple approaches for each genre
      for (const genre of subGenres) {
        try {
          // Method 1: Search by genre
          const searchResponse = await fetch(
            `https://api.spotify.com/v1/search?q=genre:${genre}&type=track&limit=20&offset=${Math.floor(Math.random() * 100)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          )

          if (searchResponse.ok) {
            const data = await searchResponse.json()
            if (data.tracks?.items) {
              tracks.push(...data.tracks.items)
            }
          }

          // Method 2: Get recommendations
          const recommendationsResponse = await fetch(
            `https://api.spotify.com/v1/recommendations?seed_genres=${genre}&limit=15`,
            { headers: { Authorization: `Bearer ${token}` } },
          )

          if (recommendationsResponse.ok) {
            const recData = await recommendationsResponse.json()
            if (recData.tracks) {
              tracks.push(...recData.tracks)
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch for genre ${genre}:`, error)
        }
      }

      // Remove duplicates and limit to 50 tracks per genre
      const uniqueTracks = tracks
        .filter((track, index, self) => track && track.id && index === self.findIndex((t) => t && t.id === track.id))
        .slice(0, 50)

      genreData[mainGenre] = uniqueTracks
    }

    return NextResponse.json({ genres: genreData })
  } catch (error) {
    console.error("Genres data API error:", error)
    return NextResponse.json({ genres: {} }, { status: 200 }) // Return empty but valid response
  }
}
