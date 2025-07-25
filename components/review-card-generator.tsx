"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Download, Palette, Sparkles, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { toPng, toCanvas } from "html-to-image"

interface ReviewData {
  songName: string
  artistName: string
  albumName: string
  albumImage: string
  username: string
  reviewContent: string
  rating: number
  reviewDate: string
}

interface ReviewCardGeneratorProps {
  reviewData: ReviewData
  isOpen: boolean
  onClose: () => void
}

const themes = {
  midnight: {
    name: "Midnight",
    background: "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #0f0f0f 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#a0a0a0",
    accent: "#ef4444",
    cardBg: "rgba(17, 17, 17, 0.95)",
    overlay: "rgba(0, 0, 0, 0.4)",
  },
  sunset: {
    name: "Sunset",
    background: "linear-gradient(135deg, #ff6b6b 0%, #ffa500 50%, #ff4757 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#f1f1f1",
    accent: "#ffffff",
    cardBg: "rgba(255, 107, 107, 0.9)",
    overlay: "rgba(255, 255, 255, 0.1)",
  },
  ocean: {
    name: "Ocean",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#e2e8f0",
    accent: "#4fd1c7",
    cardBg: "rgba(102, 126, 234, 0.9)",
    overlay: "rgba(0, 0, 0, 0.2)",
  },
  forest: {
    name: "Forest",
    background: "linear-gradient(135deg, #134e5e 0%, #71b280 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#e2e8f0",
    accent: "#68d391",
    cardBg: "rgba(19, 78, 94, 0.9)",
    overlay: "rgba(0, 0, 0, 0.3)",
  },
  fire: {
    name: "Fire",
    background: "linear-gradient(135deg, #ff512f 0%, #dd2476 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#fed7d7",
    accent: "#fbb6ce",
    cardBg: "rgba(255, 81, 47, 0.9)",
    overlay: "rgba(0, 0, 0, 0.2)",
  },
  beatshelf: {
    name: "BeatShelf Dark",
    background: "linear-gradient(135deg, #000000 0%, #1a0000 50%, #000000 100%)",
    textPrimary: "#ffffff",
    textSecondary: "#a0a0a0",
    accent: "#ef4444",
    cardBg: "rgba(0, 0, 0, 0.95)",
    overlay: "rgba(239, 68, 68, 0.1)",
  },
}

const genreStickers = {
  rock: "🎸",
  pop: "🎤",
  hiphop: "🎵",
  electronic: "🎛️",
  jazz: "🎺",
  classical: "🎼",
  country: "🤠",
  reggae: "🌴",
  blues: "🎷",
  folk: "🪕",
  metal: "⚡",
  punk: "💀",
  indie: "🌟",
  rnb: "💫",
  latin: "💃",
}

const ratingStickers = {
  1: { emoji: "💭", text: "MEH" },
  2: { emoji: "👌", text: "OKAY" },
  3: { emoji: "👍", text: "GOOD" },
  4: { emoji: "⭐", text: "AMAZING" },
  5: { emoji: "🔥", text: "MASTERPIECE" },
}

export function ReviewCardGenerator({ reviewData, isOpen, onClose }: ReviewCardGeneratorProps) {
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof themes>("beatshelf")
  const [showStickers, setShowStickers] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState<keyof typeof genreStickers>("pop")
  const [cardSize, setCardSize] = useState<"story" | "post" | "auto">("auto")
  const [isGenerating, setIsGenerating] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const theme = themes[selectedTheme]

  // Safe rating lookup with fallback
  const safeRating = Math.max(1, Math.min(5, Math.round(reviewData.rating || 1)))
  const ratingSticker = ratingStickers[safeRating as keyof typeof ratingStickers] || ratingStickers[1]

  const stripHtml = (html: string) => {
    if (!html) return ""
    const tmp = document.createElement("div")
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ""
  }

  const cleanReviewText = stripHtml(reviewData.reviewContent || "")

  // Calculate dynamic dimensions based on content
  const calculateDimensions = () => {
    const baseWidth = 540
    const baseHeight = 960

    if (cardSize === "story") return { width: baseWidth, height: baseHeight }
    if (cardSize === "post") return { width: baseWidth, height: baseWidth }

    // Auto sizing based on content
    const textLength = cleanReviewText.length
    const minHeight = 800
    const maxHeight = 1200
    const calculatedHeight = Math.min(maxHeight, Math.max(minHeight, minHeight + textLength * 2))

    return { width: baseWidth, height: calculatedHeight }
  }

  const dimensions = calculateDimensions()

  // Alternative canvas-based generation method
  const generateCardCanvas = useCallback(async () => {
    if (!cardRef.current) {
      toast({
        title: "Error",
        description: "Card element not found. Please try again.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      console.log("Starting canvas-based card generation...")

      // Wait for any pending renders and images to load
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Ensure all images are loaded
      const images = cardRef.current.querySelectorAll("img")
      await Promise.all(
        Array.from(images).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve(true)
            } else {
              img.onload = () => resolve(true)
              img.onerror = () => resolve(true)
              // Fallback timeout
              setTimeout(() => resolve(true), 3000)
            }
          })
        }),
      )

      // Try canvas method first (more reliable)
      const canvas = await toCanvas(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: "#000000",
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false,
        skipAutoScale: true,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
        filter: (node) => {
          // Skip problematic elements
          if (node.tagName === "SCRIPT") return false
          if (node.tagName === "LINK") return false
          if (node.tagName === "STYLE") return false
          if (node.classList?.contains("sr-only")) return false
          return true
        },
      })

      // Convert canvas to blob and download
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            throw new Error("Failed to create image blob")
          }

          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          const filename = `beatshelf-${reviewData.username}-${reviewData.songName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`

          link.download = filename
          link.href = url
          link.style.display = "none"

          document.body.appendChild(link)
          link.click()

          // Clean up
          setTimeout(() => {
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
          }, 100)

          console.log("Canvas download triggered successfully")

          toast({
            title: "Card downloaded! 🎉",
            description: `Your review card "${filename}" has been saved to your downloads or Gallery.`,
          })
        },
        "image/png",
        1.0,
      )
    } catch (error) {
      console.error("Canvas generation failed, trying PNG method:", error)

      // Fallback to PNG method with different settings
      try {
        const dataUrl = await toPng(cardRef.current, {
          quality: 0.95,
          pixelRatio: 1.5,
          width: dimensions.width,
          height: dimensions.height,
          backgroundColor: "#000000",
          cacheBust: true,
          skipFonts: true,
          includeQueryParams: false,
          style: {
            transform: "scale(1)",
            transformOrigin: "top left",
          },
          filter: (node) => {
            // More aggressive filtering for problematic elements
            if (node.tagName === "SCRIPT") return false
            if (node.tagName === "LINK") return false
            if (node.tagName === "STYLE") return false
            if (node.classList?.contains("sr-only")) return false
            if (node.nodeType === Node.COMMENT_NODE) return false
            return true
          },
        })

        const link = document.createElement("a")
        const filename = `beatshelf-${reviewData.username}-${reviewData.songName.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`

        link.download = filename
        link.href = dataUrl
        link.style.display = "none"

        document.body.appendChild(link)
        link.click()

        setTimeout(() => {
          document.body.removeChild(link)
        }, 100)

        toast({
          title: "Card downloaded! 🎉",
          description: `Your review card "${filename}" has been saved to your downloads.`,
        })
      } catch (fallbackError) {
        console.error("Both generation methods failed:", fallbackError)
        toast({
          title: "Download failed",
          description: "Unable to generate card. Please try refreshing the page or using a different browser.",
          variant: "destructive",
        })
      }
    } finally {
      setIsGenerating(false)
    }
  }, [dimensions, reviewData.username, reviewData.songName, toast])

  const formatDate = (dateString: string) => {
    if (!dateString) return "Today"
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    } catch {
      return "Today"
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return ""
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + "..."
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto bg-black border-gray-800">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-500" />
            Generate Review Card
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Palette className="h-4 w-4 text-red-500" />
                  Customize Card
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div className="space-y-3">
                  <Label className="text-white">Theme</Label>
                  <Select
                    value={selectedTheme}
                    onValueChange={(value) => setSelectedTheme(value as keyof typeof themes)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.entries(themes).map(([key, theme]) => (
                        <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Card Size */}
                <div className="space-y-3">
                  <Label className="text-white">Card Size</Label>
                  <Select value={cardSize} onValueChange={(value) => setCardSize(value as "story" | "post" | "auto")}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="auto" className="text-white hover:bg-gray-700">
                        Auto (Fits Content)
                      </SelectItem>
                      <SelectItem value="story" className="text-white hover:bg-gray-700">
                        Instagram Story (9:16)
                      </SelectItem>
                      <SelectItem value="post" className="text-white hover:bg-gray-700">
                        Square Post (1:1)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stickers Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-white">Show Stickers</Label>
                  <Switch checked={showStickers} onCheckedChange={setShowStickers} />
                </div>

                {/* Genre Selection */}
                {showStickers && (
                  <div className="space-y-3">
                    <Label className="text-white">Genre Sticker</Label>
                    <Select
                      value={selectedGenre}
                      onValueChange={(value) => setSelectedGenre(value as keyof typeof genreStickers)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {Object.entries(genreStickers).map(([key, emoji]) => (
                          <SelectItem key={key} value={key} className="text-white hover:bg-gray-700">
                            {emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Generate Button */}
                <Button
                  onClick={generateCardCanvas}
                  disabled={isGenerating}
                  className="w-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Download className="h-4 w-4 mr-2" />
                      Download Card
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Card Info */}
            <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm text-gray-300">
                  <p>
                    <strong className="text-white">Dimensions:</strong> {dimensions.width}x{dimensions.height}px
                  </p>
                  <p>
                    <strong className="text-white">Export:</strong> High Resolution PNG
                  </p>
                  <p>
                    <strong className="text-white">Perfect for:</strong> Social Media Sharing
                  </p>
                  <p>
                    <strong className="text-white">Rating:</strong> {safeRating}/5 stars
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card Preview */}
          <div className="xl:col-span-2 flex justify-center">
            <div className="relative">
              <div
                ref={cardRef}
                className="relative overflow-hidden"
                style={{
                  width: `${dimensions.width}px`,
                  height: `${dimensions.height}px`,
                  background: theme.background,
                  borderRadius: "24px",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  fontFamily:
                    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
                }}
              >
                {/* Background Overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: theme.overlay,
                    borderRadius: "24px",
                  }}
                />

                {/* Content Container */}
                <div className="relative h-full flex flex-col justify-between" style={{ padding: "40px" }}>
                  {/* Header Section */}
                  <div className="text-center space-y-4">
                    <div
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
                      style={{
                        backgroundColor: theme.cardBg,
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${theme.accent}20`,
                      }}
                    >
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          fontSize: "16px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        B
                      </div>
                      <span
                        style={{
                          color: theme.textPrimary,
                          fontSize: "18px",
                          fontWeight: "700",
                        }}
                      >
                        BeatShelf
                      </span>
                    </div>
                  </div>

                  {/* Song Info */}
                  <div className="text-center space-y-3">
                    <h1
                      style={{
                        color: theme.textPrimary,
                        fontSize: "28px",
                        fontWeight: "800",
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                        lineHeight: "1.2",
                        margin: "0",
                        padding: "0",
                      }}
                    >
                      {truncateText(reviewData.songName || "Unknown Song", 40)}
                    </h1>
                    <p
                      style={{
                        color: theme.textSecondary,
                        fontSize: "20px",
                        fontWeight: "600",
                        margin: "0",
                        padding: "0",
                      }}
                    >
                      {truncateText(reviewData.artistName || "Unknown Artist", 35)}
                    </p>
                    <p
                      style={{
                        color: theme.textSecondary,
                        fontSize: "16px",
                        opacity: "0.8",
                        margin: "0",
                        padding: "0",
                      }}
                    >
                      {truncateText(reviewData.albumName || "Unknown Album", 40)}
                    </p>
                  </div>

                  {/* Album Art Section */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        width: "240px",
                        height: "240px",
                        borderRadius: "20px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                        border: `3px solid ${theme.accent}40`,
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <img
                        src={reviewData.albumImage || "/placeholder.svg?height=240&width=240&query=music album"}
                        alt="Album cover"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                        crossOrigin="anonymous"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjI0MCIgdmlld0JveD0iMCAwIDI0MCAyNDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iMjQwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjEyMCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LXNpemU9IjE2Ij5BbGJ1bSBDb3ZlcjwvdGV4dD4KPC9zdmc+"
                        }}
                      />
                      {showStickers && (
                        <>
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              fontSize: "28px",
                              filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                            }}
                          >
                            {genreStickers[selectedGenre]}
                          </div>
                          <div
                            style={{
                              position: "absolute",
                              bottom: "12px",
                              left: "12px",
                              padding: "6px 12px",
                              borderRadius: "20px",
                              fontSize: "12px",
                              backgroundColor: theme.accent,
                              color: selectedTheme === "sunset" ? "#000000" : theme.textPrimary,
                              fontWeight: "700",
                              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                            }}
                          >
                            {ratingSticker.emoji} {ratingSticker.text}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Rating Section */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "12px 24px",
                        borderRadius: "50px",
                        backgroundColor: theme.cardBg,
                        backdropFilter: "blur(10px)",
                        border: `1px solid ${theme.accent}30`,
                      }}
                    >
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            fontSize: "16px",
                            backgroundColor: i < safeRating ? theme.accent : "rgba(255,255,255,0.2)",
                            color:
                              i < safeRating
                                ? selectedTheme === "sunset"
                                  ? "#000000"
                                  : "#ffffff"
                                : theme.textSecondary,
                            fontWeight: "bold",
                            boxShadow: i < safeRating ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          ★
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div
                    style={{
                      textAlign: "center",
                      padding: "24px",
                      backgroundColor: theme.cardBg,
                      borderRadius: "20px",
                      border: `1px solid ${theme.accent}20`,
                      backdropFilter: "blur(10px)",
                      margin: "0 16px",
                    }}
                  >
                    <div
                      style={{
                        color: theme.textPrimary,
                        fontSize: "16px",
                        lineHeight: "1.6",
                        fontStyle: "italic",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        margin: "0",
                        padding: "0",
                      }}
                    >
                      "{cleanReviewText || "No review text available"}"
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-center space-y-2">
                    <p
                      style={{
                        color: theme.textPrimary,
                        fontSize: "20px",
                        fontWeight: "700",
                        margin: "0",
                        padding: "0",
                      }}
                    >
                      @{reviewData.username || "Anonymous"}
                    </p>
                    <p
                      style={{
                        color: theme.textSecondary,
                        fontSize: "14px",
                        opacity: "0.8",
                        margin: "0",
                        padding: "0",
                      }}
                    >
                      {formatDate(reviewData.reviewDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
