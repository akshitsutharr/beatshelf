import { NextResponse } from "next/server"
import { getSpotifyToken } from "@/lib/spotify"

export async function GET() {
  try {
    let token;
    try {
      token = await getSpotifyToken()
    } catch (e) {
      console.error("Failed to authenticate with Spotify API:", e);
      return NextResponse.json({
        featured: { items: [] },
        newReleases: { items: [] },
        topTracks: [],
        error: "Spotify Auth Failed"
      })
    }

    // Use Promise.allSettled for better error handling across endpoints
    const [featuredResult, newReleasesResult, topTracksResult] = await Promise.allSettled([
      fetch("https://api.spotify.com/v1/browse/featured-playlists?limit=6", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        if (!res.ok) throw new Error("Featured playlists failed");
        return res.json();
      }),

      fetch("https://api.spotify.com/v1/browse/new-releases?limit=50", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        if (!res.ok) throw new Error("New releases failed");
        return res.json();
      }),

      fetch("https://api.spotify.com/v1/playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=20", {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (res) => {
        if (!res.ok) throw new Error("Top tracks failed");
        return res.json();
      }),
    ])

    const results = {
      featured: { items: [] },
      newReleases: { items: [] },
      topTracks: [],
    }

    if (featuredResult.status === "fulfilled" && featuredResult.value) {
      results.featured = featuredResult.value.playlists || { items: [] }
    }

    if (newReleasesResult.status === "fulfilled" && newReleasesResult.value) {
      results.newReleases = newReleasesResult.value.albums || { items: [] }
    }

    if (topTracksResult.status === "fulfilled" && topTracksResult.value) {
      results.topTracks = topTracksResult.value.items || []
    }

    // Alternative fallback if newReleases is fundamentally empty (Spotify region restrictions etc)
    if (results.newReleases.items?.length === 0) {
      try {
        const currentYear = new Date().getFullYear()
        const searchResponse = await fetch(
          `https://api.spotify.com/v1/search?q=year:${currentYear}&type=album&limit=50`,
          { headers: { Authorization: `Bearer ${token}` } }
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
    return NextResponse.json({
      featured: { items: [] },
      newReleases: { items: [] },
      topTracks: [],
      error: "Internal Error"
    })
  }
}
