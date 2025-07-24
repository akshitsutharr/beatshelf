import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

export async function GET() {
  try {
    const token = await getSpotifyToken()

    // Use Promise.allSettled for better error handling
    const [featuredResult, newReleasesResult, topTracksResult] = await Promise.allSettled([
      // Featured playlists
      fetch("https://api.spotify.com/v1/browse/featured-playlists?limit=6", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => (res.ok ? res.json() : null)),

      // New releases
      fetch("https://api.spotify.com/v1/browse/new-releases?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => (res.ok ? res.json() : null)),

      // Top tracks from Global Top 50 playlist
      fetch("https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => (res.ok ? res.json() : null)),
    ])

    const results = {
      featured: { items: [] },
      newReleases: { items: [] },
      topTracks: [],
    }

    // Process featured playlists
    if (featuredResult.status === "fulfilled" && featuredResult.value) {
      results.featured = featuredResult.value.playlists || { items: [] }
    }

    // Process new releases
    if (newReleasesResult.status === "fulfilled" && newReleasesResult.value) {
      results.newReleases = newReleasesResult.value.albums || { items: [] }
    }

    // Process top tracks
    if (topTracksResult.status === "fulfilled" && topTracksResult.value) {
      results.topTracks = topTracksResult.value.items || []
    }

    // If no new releases, try alternative search
    if (results.newReleases.items.length === 0) {
      try {
        const currentYear = new Date().getFullYear()
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=year:${currentYear}&type=album&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } },
        )

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          results.newReleases = searchData.albums || { items: [] }
        }
      } catch (error) {
        console.warn("Fallback search failed:", error)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Featured API error:", error)

    // Return empty but valid structure
    return NextResponse.json({
      featured: { items: [] },
      newReleases: { items: [] },
      topTracks: [],
    })
  }
}
