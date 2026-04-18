import "server-only"

import { createClient } from "@supabase/supabase-js"

export function createSupabaseAdminClient(context: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    const missingVars = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !serviceRoleKey ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    ].filter(Boolean)

    console.error(`[${context}] Missing required server env vars:`, missingVars)

    return {
      client: null,
      error: `Missing server env vars: ${missingVars.join(", ")}. Add them to .env.local and restart Next.js dev server.`,
      missingVars,
    }
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return {
    client,
    error: null,
    missingVars: [] as string[],
  }
}
