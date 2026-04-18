"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Search, User, LogOut, Settings, Heart, Music, MessageCircle, BarChart3, Menu, X, House, TrendingUp, Compass, Users, Disc3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { UserPanel } from "@/components/user-panel"

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserPanel, setShowUserPanel] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    setMobileMenuOpen(false)
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/trending", label: "Trending" },
    { href: "/explore", label: "Explore" },
    { href: "/artists", label: "Artists" },
    { href: "/albums", label: "Albums" },
    { href: "/reviews", label: "Reviews" },
    { href: "/dashboard", label: "Dashboard" },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-black/90 transition-colors duration-300">
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 lg:gap-6">
            {/* Logo */}
            <div className="flex items-center gap-4 lg:gap-6 min-w-0">
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden ring-1 ring-white/10 bg-white/[0.03]">
                  <Image 
                    src="/bslogo.png" 
                    alt="BeatShelf Logo" 
                    width={32} 
                    height={32} 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="font-semibold text-lg sm:text-xl tracking-[-0.03em] text-white">BeatShelf</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden xl:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1.5">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === link.href
                        ? "text-white bg-white/12 px-3.5 py-1.5 rounded-full shadow-[0_8px_22px_rgba(0,0,0,0.22)]"
                        : "text-white/55 hover:text-white px-3.5 py-1.5 rounded-full"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 hidden md:block">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-[18px] w-[18px] text-white/40 group-focus-within:text-white/70 transition-colors" />
                <Input
                  type="search"
                  placeholder="Search tracks, artists, albums"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-10 w-full rounded-full border border-white/10 bg-white/[0.05] text-white placeholder:text-white/40 focus:border-white/20 focus:bg-white/[0.08] focus-visible:ring-0 transition-all text-[15px]"
                />
              </div>
            </form>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  {/* Desktop User Menu */}
                  <div className="hidden md:block">
                    <div
                      className="relative"
                      onMouseEnter={() => setShowUserPanel(true)}
                      onMouseLeave={() => setShowUserPanel(false)}
                    >
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                        <Avatar className="h-10 w-10 ring-2 ring-transparent hover:ring-red-600/50 transition-all">
                          <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.username} />
                          <AvatarFallback className="bg-gray-700 text-white font-bold">
                            {profile?.username?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Menu Button */}
                  <Button
                    variant="ghost"
                    className="md:hidden h-10 w-10 p-0"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  >
                    {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                  </Button>

                  {/* Mobile Dropdown Menu */}
                  <div className="md:hidden">
                    <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt={profile?.username} />
                            <AvatarFallback className="bg-gray-700 text-white">
                              {profile?.username?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700 rounded-2xl" align="end">
                        <div className="flex items-center justify-start gap-2 p-2">
                          <div className="flex flex-col space-y-1 leading-none">
                            <p className="font-medium text-white">{profile?.username}</p>
                            <p className="w-[200px] truncate text-sm text-gray-400">{user.email}</p>
                          </div>
                        </div>
                        <DropdownMenuSeparator className="bg-gray-700" />

                        {/* Mobile Navigation Links */}
                        <div className="lg:hidden">
                          {navLinks.map((link) => (
                            <DropdownMenuItem
                              key={link.href}
                              asChild
                              className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
                            >
                              <Link href={link.href} onClick={() => setMobileMenuOpen(false)}>
                                {link.label}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator className="bg-gray-700" />
                        </div>

                        <DropdownMenuItem
                          asChild
                          className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
                        >
                          <Link href={`/profile/${profile?.username}`} onClick={() => setMobileMenuOpen(false)}>
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
                        >
                          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Dashboard
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
                        >
                          <Link href="/favorites" onClick={() => setMobileMenuOpen(false)}>
                            <Heart className="mr-2 h-4 w-4" />
                            Favorites
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
                        >
                          <Link href="/write-review" onClick={() => setMobileMenuOpen(false)}>
                            <MessageCircle className="mr-2 h-4 w-4" />
                            Write Review
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          asChild
                          className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
                        >
                          <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem
                          onClick={handleSignOut}
                          className="text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Sign out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="text-white/70 hover:text-white rounded-xl text-sm" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>

                  <Button className="bg-red-500 hover:bg-red-400 text-white rounded-2xl text-sm shadow-[0_8px_30px_rgba(255,59,48,0.28)]" asChild>
                    <Link href="/sign-up">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-[18px] w-[18px] text-white/40" />
                <Input
                  type="search"
                  placeholder="Search music..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 w-full rounded-full border border-white/10 bg-white/[0.05] text-white placeholder:text-white/40 focus:border-white/20 focus-visible:ring-0 transition-all text-base"
                />
              </div>
            </form>
          </div>
        </div>
      </nav>

      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] max-w-[480px]">
        <div className="rounded-[1.5rem] border border-white/10 bg-black/90 px-3 py-2.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px] font-medium text-white/65">
            <Link href="/" className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${pathname === '/' ? 'bg-white/12 text-white' : 'hover:bg-white/6 hover:text-white'}`}>
              <House className="h-4 w-4" /> Home
            </Link>
            <Link href="/trending" className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${pathname === '/trending' ? 'bg-white/12 text-white' : 'hover:bg-white/6 hover:text-white'}`}>
              <TrendingUp className="h-4 w-4" /> Trending
            </Link>
            <Link href="/explore" className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${pathname === '/explore' ? 'bg-white/12 text-white' : 'hover:bg-white/6 hover:text-white'}`}>
              <Compass className="h-4 w-4" /> Explore
            </Link>
            <Link href="/artists" className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${pathname === '/artists' ? 'bg-white/12 text-white' : 'hover:bg-white/6 hover:text-white'}`}>
              <Users className="h-4 w-4" /> Artists
            </Link>
            <Link href="/albums" className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${pathname === '/albums' ? 'bg-white/12 text-white' : 'hover:bg-white/6 hover:text-white'}`}>
              <Disc3 className="h-4 w-4" /> Albums
            </Link>
            <Link href="/reviews" className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${pathname === '/reviews' ? 'bg-white/12 text-white' : 'hover:bg-white/6 hover:text-white'}`}>
              <MessageCircle className="h-4 w-4" /> Reviews
            </Link>
            <Link href="/dashboard" className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${pathname === '/dashboard' ? 'bg-white/12 text-white' : 'hover:bg-white/6 hover:text-white'}`}>
              <User className="h-4 w-4" /> Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* User Panel */}
      {user && (
        <UserPanel
          isVisible={showUserPanel}
          onMouseEnter={() => setShowUserPanel(true)}
          onMouseLeave={() => setShowUserPanel(false)}
        />
      )}
    </>
  )
}
