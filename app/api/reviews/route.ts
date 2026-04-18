import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { clerkIdToDatabaseId } from "@/lib/db-id"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

type ReviewRequest = {
  songId: string
  song?: {
    id: string
    name: string
    artist_name: string
    album_name: string
    album_image_url?: string | null
    preview_url?: string | null
    duration_ms?: number | null
    release_date?: string | null
    spotify_url?: string | null
  }
  content: string
  rating?: number
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID()

  try {
    const { userId } = await auth()
    if (!userId) {
      console.error(`[api/reviews][${requestId}] Unauthorized request`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createSupabaseAdminClient("api/reviews")
    if (!adminClient.client) {
      return NextResponse.json(
        {
          error: "Supabase service role is not configured",
          details: adminClient.error,
          requestId,
        },
        { status: 500 },
      )
    }
    const admin = adminClient.client

    const payload = (await request.json()) as ReviewRequest
    const songId = payload.songId?.trim()
    const content = payload.content?.trim()
    const rating = Number(payload.rating || 0)

    if (!songId || !content) {
      console.error(`[api/reviews][${requestId}] Invalid payload`, { songId: Boolean(songId), content: Boolean(content) })
      return NextResponse.json({ error: "Song and review content are required" }, { status: 400 })
    }

    const databaseUserId = clerkIdToDatabaseId(userId)

    const clerkUser = await currentUser()
    const fallbackUsername =
      clerkUser?.username ||
      clerkUser?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ||
      `user_${databaseUserId.slice(0, 8)}`
    const fullName = `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim()

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: databaseUserId,
        username: fallbackUsername,
        full_name: fullName || null,
        avatar_url: clerkUser?.imageUrl || null,
      },
      { onConflict: "id" },
    )

    if (profileError) {
      console.error(`[api/reviews][${requestId}] Profile upsert error`, profileError)
      return NextResponse.json({ error: "Failed to prepare user profile", details: profileError.message, requestId }, { status: 500 })
    }

    if (payload.song) {
      const releaseDate = payload.song.release_date ? new Date(payload.song.release_date).toISOString().slice(0, 10) : null
      const { error: songUpsertError } = await admin.from("songs").upsert({
        id: songId,
        name: payload.song.name,
        artist_name: payload.song.artist_name,
        album_name: payload.song.album_name,
        album_image_url: payload.song.album_image_url || null,
        preview_url: payload.song.preview_url || null,
        duration_ms: payload.song.duration_ms ?? null,
        release_date: releaseDate,
        spotify_url: payload.song.spotify_url || null,
      })

      if (songUpsertError) {
        console.error(`[api/reviews][${requestId}] Song upsert error`, songUpsertError)
        return NextResponse.json({ error: "Failed to cache song", details: songUpsertError.message, requestId }, { status: 500 })
      }
    }

    if (rating > 0) {
      const { error: ratingUpsertError } = await admin.from("ratings").upsert({
        user_id: databaseUserId,
        song_id: songId,
        rating,
      })

      if (ratingUpsertError) {
        console.error(`[api/reviews][${requestId}] Rating upsert error`, ratingUpsertError)
        return NextResponse.json({ error: "Failed to save rating", details: ratingUpsertError.message, requestId }, { status: 500 })
      }
    }

    const { data, error } = await admin
      .from("reviews")
      .upsert(
        {
          user_id: databaseUserId,
          song_id: songId,
          content,
        },
        { onConflict: "user_id,song_id" },
      )
      .select("id, content, created_at, song_id")
      .single()

    if (error) {
      console.error(`[api/reviews][${requestId}] Review upsert error`, error)
      return NextResponse.json({ error: error.message, requestId }, { status: 500 })
    }

    return NextResponse.json({ review: data })
  } catch (error) {
    console.error(`[api/reviews][${requestId}] Unhandled error`, error)
    return NextResponse.json({ error: "Failed to save review", details: String(error), requestId }, { status: 500 })
  }
}