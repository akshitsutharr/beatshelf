import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'BeatShelf - Discover, Review, and Share Music',
  description:
    'A social platform for music discovery, reviews, and ratings. Find your next favorite song and share your musical taste with the community.',
  authors: [{ name: 'Akshit Suthar' }],
  icons: {
    icon: '/icon1.png',
    shortcut: '/icon1.png',
    apple: '/icon1.png',
  },
  metadataBase: new URL('https://beatshelf.vercel.app'),
  openGraph: {
    title: 'BeatShelf - Share & Rate Music',
    description:
      'Explore trending songs, write reviews, and discover music with the BeatShelf community.',
    url: 'https://beatshelf.vercel.app',
    siteName: 'BeatShelf',
    images: [
      {
        url: 'https://beatshelf.vercel.app/preview.png',
        width: 1200,
        height: 630,
        alt: 'BeatShelf Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BeatShelf - Music Reviews & Community',
    description:
      'Discover, review, and rate music like never before. Join BeatShelf today!',
    images: ['https://beatshelf.vercel.app/preview.png'],
    creator: '@akshitsuthar', // optional if you have a Twitter
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxSnippet: -1,
      maxImagePreview: 'large',
      maxVideoPreview: -1,
    },
  },
  keywords: [
    'BeatShelf',
    'Music Reviews',
    'Music Discovery',
    'Song Ratings',
    'Playlist App',
    'Rate Songs',
    'Music Social Platform',
    'Akshit Suthar',
  ],
  category: 'music',
};

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
