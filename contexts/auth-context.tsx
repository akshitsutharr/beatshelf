"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/nextjs"
import { supabase } from "@/lib/supabase"
import { clerkIdToDatabaseId } from "@/lib/db-id"

interface AppUser {
  id: string
  email?: string
  created_at?: string
  user_metadata?: {
    username?: string
    avatar_url?: string | null
  }
}

interface AuthContextType {
  user: AppUser | null
  profile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, username: string) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerk()
  const { getToken } = useClerkAuth()

  const [profile, setProfile] = useState<any | null>(null)
  const lastSyncedUserRef = useRef<string | null>(null)

  const user: AppUser | null = useMemo(() => {
    if (!clerkUser) return null
    const databaseId = clerkIdToDatabaseId(clerkUser.id)
    return {
      id: databaseId,
      email: clerkUser.primaryEmailAddress?.emailAddress,
      created_at: clerkUser.createdAt?.toISOString?.(),
      user_metadata: {
        username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0],
        avatar_url: clerkUser.imageUrl,
      },
    }
  }, [clerkUser])

  useEffect(() => {
    const syncAndFetch = async () => {
      if (!user) {
        setProfile(null)
        return
      }

      try {
        if (lastSyncedUserRef.current !== user.id) {
          const token = await getToken()
          const response = await fetch("/api/auth/sync-profile", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })

          if (response.ok) {
            lastSyncedUserRef.current = user.id
          }
        }
      } catch (error) {
        console.error("Profile sync failed:", error)
      }

      try {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(data || null)
      } catch (error) {
        console.error("Profile fetch failed:", error)
        setProfile(null)
      }
    }

    syncAndFetch()
  }, [user, getToken])

  const signIn = async () => {
    return {
      data: null,
      error: {
        message: "Use /sign-in page for Clerk authentication.",
      },
    }
  }

  const signUp = async () => {
    return {
      data: null,
      error: {
        message: "Use /sign-up page for Clerk authentication.",
      },
    }
  }

  const signOut = async () => {
    await clerkSignOut({ redirectUrl: "/" })
  }

  const value: AuthContextType = {
    user,
    profile,
    loading: !isLoaded,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
