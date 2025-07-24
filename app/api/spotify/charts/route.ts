import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

export async function GET() {
  try {
    const token = await getSpotifyToken()

    // Try multiple chart sources with Promise.allSettled for better error handling
    const chartSources = [
      "37i9dQZEVXbMDoHDwVN2tF", // Global Top 50
      "37i9dQZEVXbLiRSasKsNU9", // Global Viral 50
      "37i9dQZEVXbNG2KDcFcKOF", // Top Songs - Global
    ]

    const chartPromises = chartSources.map(async (playlistId) => {
      try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=20`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const data = await response.json()
          return data.items?.filter((item: any) => item.track && item.track.id) || []
        }
        return []
      } catch (error) {
        console.warn(`Failed to fetch playlist ${playlistId}:`, error)
        return []
      }
    })

    const chartResults = await Promise.allSettled(chartPromises)
    const allTracks: any[] = []

    // Collect all successful results
    chartResults.forEach((result) => {
      if (result.status === "fulfilled") {
        allTracks.push(...result.value)
      }
    })

    // If no tracks from playlists, try search-based approach
    if (allTracks.length === 0) {
      try {
        const searchQueries = ["pop", "rock", "hip-hop", "electronic"]

        for (const query of searchQueries) {
          const response = await fetch(
            `https://api.spotify.com/v1/search?q=genre:${query}&type=track&limit=15&offset=${Math.floor(Math.random() * 100)}`,
            { headers: { Authorization: `Bearer ${token}` } },
          )

          if (response.ok) {
            const data = await response.json()
            if (data.tracks?.items) {
              // Convert search results to playlist format
              const searchTracks = data.tracks.items.map((track: any) => ({ track }))
              allTracks.push(...searchTracks)
            }
          }
        }
      } catch (error) {
        console.warn("Search fallback failed:", error)
      }
    }

    // Remove duplicates and shuffle
    const uniqueTracks = allTracks
      .filter((item, index, self) => item?.track?.id && index === self.findIndex((t) => t?.track?.id === item.track.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 50)

    return NextResponse.json({ tracks: uniqueTracks })
  } catch (error) {
    console.error("Charts API error:", error)

    // Return empty array instead of error
    return NextResponse.json({ tracks: [] })
  }
}
