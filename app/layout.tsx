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
  metadataBase: new URL('https://beatshelf.vercel.app'),
  verification: {
    google: 'jY4malBVzB7Jldw1_KK9HIf9uUeLn84HMic_0PvABec', 
  },
  icons: {
    icon: '/icon1.png',
    shortcut: '/icon1.png',
    apple: '/icon1.png',
  },
  openGraph: {
    title: 'BeatShelf',
    description:
      'Rate, review, and share your favorite music with the world.',
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
    title: 'BeatShelf',
    description: 'Music reviews and community sharing platform.',
    images: ['https://beatshelf.vercel.app/preview.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
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
