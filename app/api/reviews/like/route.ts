import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { clerkIdToDatabaseId } from "@/lib/db-id"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { reviewId, action } = await request.json()
    if (!reviewId || !action) return NextResponse.json({ error: "Missing review ID or action" }, { status: 400 })

    const databaseUserId = clerkIdToDatabaseId(userId)
    const adminClient = createSupabaseAdminClient("api/reviews/like")
    if (!adminClient.client) throw new Error("Service role not configured")
    const admin = adminClient.client

    if (action === "like") {
      const { error } = await admin.from("review_likes").upsert({ review_id: reviewId, user_id: databaseUserId })
      if (error) throw error
    } else if (action === "unlike") {
      const { error } = await admin.from("review_likes").delete().eq("review_id", reviewId).eq("user_id", databaseUserId)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Like API Error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
