"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, User, LogOut, Settings, Heart, Music, MessageCircle, BarChart3, Menu, X } from "lucide-react"
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
    { href: "/reviews", label: "Reviews" },
  ]

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b border-gray-800 bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 bg-red-600 rounded-xl flex items-center justify-center">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <span className="font-bold text-xl text-white hidden sm:block">BeatShelf</span>
                <span className="font-bold text-lg text-white sm:hidden">BS</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search for songs, artists, albums..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-xl"
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
                  <Button variant="ghost" className="text-gray-300 hover:text-white rounded-xl text-sm" asChild>
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm" asChild>
                    <Link href="/auth/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="sm:hidden pb-4">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search music..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-red-600 rounded-xl"
                />
              </div>
            </form>
          </div>
        </div>
      </nav>

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
