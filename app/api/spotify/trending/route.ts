import { type NextRequest, NextResponse } from "next/server"
import { getNewReleases } from "@/lib/spotify"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const results = await getNewReleases(limit, offset)
    return NextResponse.json(results)
  } catch (error) {
    console.error("Trending error:", error)
    return NextResponse.json({ error: "Failed to get trending tracks" }, { status: 500 })
  }
}
