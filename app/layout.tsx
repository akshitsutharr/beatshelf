import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BeatShelf - Discover, Review, and Share Music",
  description:
    "A social platform for music discovery, reviews, and ratings. Find your next favorite song and share your musical taste with the community.",
  author: 'Akshit Suthar',
  icons: {
    icon: '/icon1.png',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-black">
            <Navbar />
            <main className="relative">{children}</main>
            <Toaster />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
