import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

interface RatingRow {
  rating: number
}

interface SongWithRatings {
  artist_name: string
  ratings: RatingRow[] | null
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase credentials not configured" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from("songs")
      .select("artist_name, ratings(rating)")
      .limit(1500)

    if (error) {
      throw error
    }

    const buckets = new Map<string, { artistName: string; sum: number; count: number }>()

    for (const row of (data || []) as SongWithRatings[]) {
      const artistName = row.artist_name?.trim()
      if (!artistName) continue

      const key = artistName.toLowerCase()
      const current = buckets.get(key) || { artistName, sum: 0, count: 0 }
      const ratings = row.ratings || []

      for (const ratingRow of ratings) {
        if (typeof ratingRow.rating === "number") {
          current.sum += ratingRow.rating
          current.count += 1
        }
      }

      buckets.set(key, current)
    }

    const items = Array.from(buckets.values())
      .map((entry) => {
        const averageRating = entry.count > 0 ? entry.sum / entry.count : 0
        const trendScore = averageRating * 0.8 + Math.log10(entry.count + 1) * 1.4

        return {
          artistName: entry.artistName,
          averageRating,
          reviewCount: entry.count,
          trendScore,
        }
      })
      .filter((entry) => entry.reviewCount > 0)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 120)

    return NextResponse.json({ items })
  } catch (error) {
    console.error("Trending artists error:", error)
    return NextResponse.json({ error: "Failed to compute trending artists" }, { status: 500 })
  }
}
