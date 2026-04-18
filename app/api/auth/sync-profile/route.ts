import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { clerkIdToDatabaseId } from "@/lib/db-id"
import { createSupabaseAdminClient } from "@/lib/supabase-admin"

export async function POST() {
  const requestId = crypto.randomUUID()

  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createSupabaseAdminClient("api/auth/sync-profile")
    if (!adminClient.client) {
      return NextResponse.json({
        skipped: true,
        reason: adminClient.error,
        requestId,
      })
    }
    const admin = adminClient.client

    const user = await currentUser()
    const databaseUserId = clerkIdToDatabaseId(userId)
    const username = user?.username || user?.primaryEmailAddress?.emailAddress?.split("@")[0] || `user_${userId.slice(0, 8)}`

    const { data, error } = await admin
      .from("profiles")
      .upsert({
        id: databaseUserId,
        username,
        full_name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null,
        avatar_url: user?.imageUrl || null,
      })
      .select("*")
      .single()

    if (error) {
      console.error(`[api/auth/sync-profile][${requestId}] Profile sync error`, error)
      return NextResponse.json({ skipped: true, reason: error.message, requestId })
    }

    return NextResponse.json({ profile: data })
  } catch (error) {
    console.error(`[api/auth/sync-profile][${requestId}] Unhandled error`, error)
    return NextResponse.json({ skipped: true, reason: String(error), requestId })
  }
}
