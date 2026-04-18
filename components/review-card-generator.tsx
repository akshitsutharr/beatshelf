"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toPng, toCanvas } from "html-to-image"
import Image from "next/image";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ReviewData {
  songName: string
  artistName: string
  albumName: string
  albumImage: string
  username: string
  reviewContent: string
  rating: number
  reviewDate: string
  mediaType?: "song" | "album"
}

interface ReviewCardGeneratorProps {
  reviewData: ReviewData
  isOpen: boolean
  onClose: () => void
}

// ─── Themes ──────────────────────────────────────────────────────────────────
const THEMES = {
  obsidian: {
    name: "Obsidian",
    label: "🖤",
    bg: "linear-gradient(160deg,#0a0a0a 0%,#111 60%,#0d0d0d 100%)",
    card: "rgba(255,255,255,0.04)",
    border: "rgba(255,255,255,0.08)",
    accent: "#e4e4e7",
    accentBright: "#ffffff",
    tag: "#ffffff",
    tagText: "#000000",
    primary: "#ffffff",
    secondary: "rgba(255,255,255,0.45)",
    tertiary: "rgba(255,255,255,0.25)",
    starFilled: "#ffffff",
    starEmpty: "rgba(255,255,255,0.15)",
    glow: "rgba(255,255,255,0.06)",
    noise: true,
  },
  aurora: {
    name: "Aurora",
    label: "🌌",
    bg: "linear-gradient(145deg,#020917 0%,#061428 35%,#0a1f1a 65%,#050d18 100%)",
    card: "rgba(52,211,153,0.06)",
    border: "rgba(52,211,153,0.15)",
    accent: "#34d399",
    accentBright: "#6ee7b7",
    tag: "#34d399",
    tagText: "#000",
    primary: "#f0fdf4",
    secondary: "rgba(209,250,229,0.5)",
    tertiary: "rgba(209,250,229,0.25)",
    starFilled: "#34d399",
    starEmpty: "rgba(52,211,153,0.15)",
    glow: "rgba(52,211,153,0.12)",
    noise: true,
  },
  crimson: {
    name: "Crimson",
    label: "🔴",
    bg: "linear-gradient(150deg,#0d0002 0%,#1a0005 40%,#0d0002 100%)",
    card: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.15)",
    accent: "#ef4444",
    accentBright: "#fca5a5",
    tag: "#ef4444",
    tagText: "#fff",
    primary: "#fff1f2",
    secondary: "rgba(254,205,211,0.55)",
    tertiary: "rgba(254,205,211,0.25)",
    starFilled: "#ef4444",
    starEmpty: "rgba(239,68,68,0.15)",
    glow: "rgba(239,68,68,0.12)",
    noise: true,
  },
  glacier: {
    name: "Glacier",
    label: "🧊",
    bg: "linear-gradient(155deg,#f8fafc 0%,#e2eaf4 40%,#d1dce8 100%)",
    card: "rgba(255,255,255,0.7)",
    border: "rgba(148,163,184,0.2)",
    accent: "#3b82f6",
    accentBright: "#1d4ed8",
    tag: "#3b82f6",
    tagText: "#fff",
    primary: "#0f172a",
    secondary: "rgba(15,23,42,0.55)",
    tertiary: "rgba(15,23,42,0.3)",
    starFilled: "#3b82f6",
    starEmpty: "rgba(59,130,246,0.2)",
    glow: "rgba(59,130,246,0.1)",
    noise: false,
  },
  violet: {
    name: "Velvet",
    label: "💜",
    bg: "linear-gradient(150deg,#06000f 0%,#120520 45%,#0a001a 100%)",
    card: "rgba(167,139,250,0.07)",
    border: "rgba(167,139,250,0.18)",
    accent: "#a78bfa",
    accentBright: "#c4b5fd",
    tag: "#a78bfa",
    tagText: "#000",
    primary: "#f5f3ff",
    secondary: "rgba(221,214,254,0.55)",
    tertiary: "rgba(221,214,254,0.25)",
    starFilled: "#a78bfa",
    starEmpty: "rgba(167,139,250,0.15)",
    glow: "rgba(167,139,250,0.12)",
    noise: true,
  },
  solar: {
    name: "Solar",
    label: "🌞",
    bg: "linear-gradient(150deg,#1a0800 0%,#2d1200 40%,#1a0800 100%)",
    card: "rgba(251,146,60,0.07)",
    border: "rgba(251,146,60,0.15)",
    accent: "#fb923c",
    accentBright: "#fdba74",
    tag: "#fb923c",
    tagText: "#000",
    primary: "#fff7ed",
    secondary: "rgba(254,215,170,0.55)",
    tertiary: "rgba(254,215,170,0.25)",
    starFilled: "#fb923c",
    starEmpty: "rgba(251,146,60,0.15)",
    glow: "rgba(251,146,60,0.12)",
    noise: true,
  },
  pearl: {
    name: "Pearl",
    label: "🤍",
    bg: "linear-gradient(160deg,#fefefe 0%,#f5f4f0 50%,#ede9e3 100%)",
    card: "rgba(0,0,0,0.04)",
    border: "rgba(0,0,0,0.07)",
    accent: "#1c1917",
    accentBright: "#292524",
    tag: "#1c1917",
    tagText: "#fff",
    primary: "#1c1917",
    secondary: "rgba(28,25,23,0.5)",
    tertiary: "rgba(28,25,23,0.25)",
    starFilled: "#1c1917",
    starEmpty: "rgba(28,25,23,0.12)",
    glow: "rgba(0,0,0,0.05)",
    noise: false,
  },
  neon: {
    name: "Neon",
    label: "⚡",
    bg: "linear-gradient(150deg,#000000 0%,#050014 50%,#000000 100%)",
    card: "rgba(0,255,163,0.05)",
    border: "rgba(0,255,163,0.2)",
    accent: "#00ffa3",
    accentBright: "#00ff88",
    tag: "#00ffa3",
    tagText: "#000",
    primary: "#f0fff8",
    secondary: "rgba(187,247,208,0.5)",
    tertiary: "rgba(187,247,208,0.25)",
    starFilled: "#00ffa3",
    starEmpty: "rgba(0,255,163,0.12)",
    glow: "rgba(0,255,163,0.15)",
    noise: true,
  },
} as const

type ThemeKey = keyof typeof THEMES

// ─── Layouts ─────────────────────────────────────────────────────────────────
const LAYOUTS = {
  cinematic: { name: "Cinematic", icon: "⬛" },
  editorial: { name: "Editorial", icon: "📰" },
  centered: { name: "Centered", icon: "⭕" },
  side: { name: "Side by Side", icon: "◀▶" },
} as const
type LayoutKey = keyof typeof LAYOUTS

// ─── Fonts ───────────────────────────────────────────────────────────────────
const FONTS = {
  clash: { name: "Clash Display", stack: "'Clash Display', 'DM Sans', sans-serif", label: "Aa" },
  playfair: { name: "Playfair Display", stack: "'Playfair Display', Georgia, serif", label: "Aa" },
  satoshi: { name: "Satoshi", stack: "'Satoshi', 'Plus Jakarta Sans', sans-serif", label: "Aa" },
  mono: { name: "Mono", stack: "'JetBrains Mono', 'Fira Code', monospace", label: "Aa" },
  syne: { name: "Syne", stack: "'Syne', 'Space Grotesk', sans-serif", label: "Aa" },
} as const
type FontKey = keyof typeof FONTS

// ─── Sizes ───────────────────────────────────────────────────────────────────
const SIZES = {
  story: { w: 540, h: 960, label: "Story 9:16", icon: "📱" },
  post: { w: 600, h: 600, label: "Post 1:1", icon: "⬜" },
  wide: { w: 700, h: 420, label: "Wide 16:9", icon: "🖥" },
} as const
type SizeKey = keyof typeof SIZES

// ─── Rating Labels ────────────────────────────────────────────────────────────
const RATING_META: Record<number, { word: string; color: string }> = {
  1: { word: "MEH", color: "#94a3b8" },
  2: { word: "DECENT", color: "#60a5fa" },
  3: { word: "SOLID", color: "#34d399" },
  4: { word: "GREAT", color: "#fb923c" },
  5: { word: "FIRE 🔥", color: "#ef4444" },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const stripHtml = (html: string) => {
  if (!html) return ""
  const d = document.createElement("div")
  d.innerHTML = html
  return d.textContent || d.innerText || ""
}

const trunc = (t: string, n: number) => (t.length <= n ? t : t.slice(0, n).trim() + "…")

const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  } catch {
    return "Today"
  }
}

// ─── Card Preview Component ───────────────────────────────────────────────────
function CardPreview({
  cardRef,
  reviewData,
  theme,
  layout,
  font,
  size,
  showRatingBadge,
  previewMaxWidth = 460,
}: {
  cardRef: React.RefObject<HTMLDivElement>
  reviewData: ReviewData
  theme: (typeof THEMES)[ThemeKey]
  layout: LayoutKey
  font: (typeof FONTS)[FontKey]
  size: (typeof SIZES)[SizeKey]
  showRatingBadge: boolean
  previewMaxWidth?: number
}) {
  const t = theme
  const safeRating = Math.max(1, Math.min(5, Math.round(reviewData.rating || 3)))
  const ratingMeta = RATING_META[safeRating]
  const cleanText = stripHtml(reviewData.reviewContent || "")
  const isCentered = layout === "centered"
  const isEditorial = layout === "editorial"
  const isSide = layout === "side"
  const isCinematic = layout === "cinematic"

  const scale = Math.min(1, previewMaxWidth / size.w)
  const imgSize = isSide ? 180 : isCentered ? 220 : isEditorial ? 200 : 240

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top center",
        marginBottom: `${(size.h * scale) - size.h}px`,
        marginLeft: `${((size.w * scale) - size.w) / 2}px`,
        marginRight: `${((size.w * scale) - size.w) / 2}px`,
      }}
    >
      <div
        ref={cardRef}
        style={{
          width: size.w,
          height: size.h,
          background: t.bg,
          fontFamily: font.stack,
          position: "relative",
          overflow: "hidden",
          borderRadius: 28,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* Noise texture */}
        {t.noise && (
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04, pointerEvents: "none", zIndex: 1 }} aria-hidden>
            <filter id="nz"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
            <rect width="100%" height="100%" filter="url(#nz)" />
          </svg>
        )}

        {/* Glow orb */}
        <div style={{
          position: "absolute", width: size.w * 0.8, height: size.w * 0.8,
          borderRadius: "50%",
          background: t.glow,
          filter: "blur(80px)",
          top: "10%", left: "10%",
          zIndex: 0, pointerEvents: "none",
        }} />

        {/* Inner content */}
        <div style={{
          position: "relative", zIndex: 2,
          display: "flex", flexDirection: "column",
          height: "100%", padding: isSide ? 36 : isEditorial ? 40 : 40,
          boxSizing: "border-box",
          gap: isCentered ? 0 : 16,
          justifyContent: isCentered ? "space-between" : "flex-start",
        }}>

          {/* TOP BAR */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Image
                src="/bslogo.png"
                alt="BeatShelf Logo"
                width={28}
                height={28}
                style={{
                  borderRadius: 8,
                  objectFit: "cover"
                }}
              />
              <span style={{ color: t.primary, fontSize: 13, fontWeight: 700, letterSpacing: "0.04em" }}>BeatShelf</span>
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 20,
              background: t.card, border: `1px solid ${t.border}`,
              fontSize: 11, color: t.secondary, letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              {reviewData.mediaType === "album" ? "Album Review" : "Song Review"}
            </div>
          </div>

          {/* LAYOUT: CINEMATIC */}
          {isCinematic && (
            <>
              {/* Album art – full bleed behind a gradient */}
              <div style={{ position: "absolute", inset: 0, zIndex: -1, opacity: 0.25, overflow: "hidden", borderRadius: 28 }}>
                <img src={reviewData.albumImage} crossOrigin="anonymous" alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(24px)", transform: "scale(1.1)" }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, flex: 1, justifyContent: "center" }}>
                <div style={{
                  width: imgSize, height: imgSize, borderRadius: 20,
                  overflow: "hidden", flexShrink: 0,
                  boxShadow: `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${t.border}`,
                  position: "relative",
                }}>
                  <img src={reviewData.albumImage} alt="" crossOrigin="anonymous"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg width='240' height='240' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23222' width='240' height='240'/%3E%3C/svg%3E" }}
                  />
                  {showRatingBadge && (
                    <div style={{
                      position: "absolute", bottom: 10, right: 10,
                      padding: "4px 10px", borderRadius: 12,
                      background: t.tag, color: t.tagText,
                      fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
                    }}>{ratingMeta.word}</div>
                  )}
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: t.primary, fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>{trunc(reviewData.songName, 32)}</div>
                  <div style={{ color: t.secondary, fontSize: 16, fontWeight: 500, marginTop: 6 }}>{trunc(reviewData.artistName, 30)}</div>
                  <div style={{ color: t.tertiary, fontSize: 13, marginTop: 2 }}>{trunc(reviewData.albumName, 36)}</div>
                </div>
                {/* Stars */}
                <div style={{ display: "flex", gap: 6 }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} style={{
                      width: 32, height: 32, borderRadius: "50%",
                      background: i <= safeRating ? t.starFilled : t.starEmpty,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: i <= safeRating ? (t.tagText) : t.secondary,
                      fontWeight: 900,
                    }}>★</div>
                  ))}
                </div>
              </div>
              {/* Review Quote */}
              <div style={{
                background: t.card, border: `1px solid ${t.border}`,
                borderRadius: 16, padding: "20px 24px",
                backdropFilter: "blur(20px)",
              }}>
                <div style={{ color: t.secondary, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Review</div>
                <div style={{ color: t.primary, fontSize: 15, lineHeight: 1.65, fontStyle: "italic" }}>"{trunc(cleanText, 200)}"</div>
              </div>
              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: t.primary, fontSize: 15, fontWeight: 700 }}>@{reviewData.username || "user"}</div>
                  <div style={{ color: t.tertiary, fontSize: 12 }}>{fmtDate(reviewData.reviewDate)}</div>
                </div>
                <div style={{ color: t.accentBright, fontSize: 22, fontWeight: 900 }}>{safeRating}.0</div>
              </div>
            </>
          )}

          {/* LAYOUT: EDITORIAL */}
          {isEditorial && (
            <>
              <div style={{ display: "flex", gap: 24, alignItems: "flex-start", marginTop: 8 }}>
                <div style={{
                  width: imgSize, height: imgSize, borderRadius: 16,
                  overflow: "hidden", flexShrink: 0,
                  boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px ${t.border}`,
                }}>
                  <img src={reviewData.albumImage} alt="" crossOrigin="anonymous"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23222' width='200' height='200'/%3E%3C/svg%3E" }}
                  />
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: t.tag, color: t.tagText, fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {ratingMeta.word}
                    </span>
                    <span style={{ padding: "3px 10px", borderRadius: 20, background: t.card, border: `1px solid ${t.border}`, color: t.secondary, fontSize: 10, letterSpacing: "0.08em" }}>
                      {safeRating}/5
                    </span>
                  </div>
                  <div style={{ color: t.primary, fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>{trunc(reviewData.songName, 26)}</div>
                  <div style={{ color: t.secondary, fontSize: 14, fontWeight: 500 }}>{trunc(reviewData.artistName, 24)}</div>
                  <div style={{ color: t.tertiary, fontSize: 12 }}>{trunc(reviewData.albumName, 28)}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ color: i <= safeRating ? t.starFilled : t.starEmpty, fontSize: 14 }}>★</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Divider */}
              <div style={{ height: 1, background: t.border, margin: "4px 0" }} />
              {/* Pull quote large */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
                <div style={{
                  borderLeft: `3px solid ${t.accent}`,
                  paddingLeft: 20,
                }}>
                  <div style={{ color: t.primary, fontSize: size.w < 600 ? 17 : 19, lineHeight: 1.7, fontStyle: "italic", fontWeight: 500 }}>
                    "{trunc(cleanText, size.h > 700 ? 320 : 200)}"
                  </div>
                </div>
              </div>
              <div style={{ height: 1, background: t.border }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: t.primary, fontSize: 14, fontWeight: 700 }}>@{reviewData.username || "user"}</div>
                  <div style={{ color: t.tertiary, fontSize: 11 }}>{fmtDate(reviewData.reviewDate)}</div>
                </div>
                <div style={{
                  fontSize: 36, fontWeight: 900, color: t.accentBright,
                  letterSpacing: "-0.04em", lineHeight: 1,
                }}>{safeRating}.0</div>
              </div>
            </>
          )}

          {/* LAYOUT: CENTERED */}
          {isCentered && (
            <>
              <div /> {/* spacer */}
              {/* Center image */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{
                  width: imgSize, height: imgSize, borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: `0 0 0 1px ${t.border}, 0 32px 80px rgba(0,0,0,0.5)`,
                }}>
                  <img src={reviewData.albumImage} alt="" crossOrigin="anonymous"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg width='220' height='220' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23222' width='220' height='220'/%3E%3C/svg%3E" }}
                  />
                </div>
              </div>
              {/* Title block */}
              <div style={{ textAlign: "center" }}>
                <div style={{ color: t.primary, fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>{trunc(reviewData.songName, 28)}</div>
                <div style={{ color: t.secondary, fontSize: 16, marginTop: 6 }}>{trunc(reviewData.artistName, 26)}</div>
                <div style={{ color: t.tertiary, fontSize: 13, marginTop: 2 }}>{trunc(reviewData.albumName, 32)}</div>
              </div>
              {/* Stars */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: i <= safeRating ? t.starFilled : t.starEmpty,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16, color: i <= safeRating ? t.tagText : t.secondary,
                    fontWeight: 900,
                  }}>★</div>
                ))}
              </div>
              {/* Quote */}
              <div style={{
                background: t.card, border: `1px solid ${t.border}`,
                borderRadius: 20, padding: "24px",
                backdropFilter: "blur(20px)", textAlign: "center",
              }}>
                <div style={{ color: t.accent, fontSize: 40, lineHeight: 0.8, marginBottom: 8, fontFamily: "serif" }}>"</div>
                <div style={{ color: t.primary, fontSize: 15, lineHeight: 1.7, fontStyle: "italic" }}>{trunc(cleanText, 220)}</div>
              </div>
              {/* Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: t.primary, fontSize: 14, fontWeight: 700 }}>@{reviewData.username || "user"}</div>
                  <div style={{ color: t.tertiary, fontSize: 11 }}>{fmtDate(reviewData.reviewDate)}</div>
                </div>
                {showRatingBadge && (
                  <div style={{
                    padding: "6px 14px", borderRadius: 20,
                    background: t.tag, color: t.tagText,
                    fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                  }}>{ratingMeta.word}</div>
                )}
              </div>
            </>
          )}

          {/* LAYOUT: SIDE BY SIDE */}
          {isSide && (
            <>
              <div style={{ display: "flex", gap: 28, flex: 1, alignItems: "center" }}>
                {/* Left column: image + meta */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", width: imgSize + 20 }}>
                  <div style={{
                    width: imgSize, height: imgSize, borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: `0 0 0 1px ${t.border}, 0 24px 60px rgba(0,0,0,0.5)`,
                  }}>
                    <img src={reviewData.albumImage} alt="" crossOrigin="anonymous"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg width='180' height='180' xmlns='http://www.w3.org/2000/svg'%3E%3Crect fill='%23222' width='180' height='180'/%3E%3C/svg%3E" }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1,2,3,4,5].map(i => (
                      <span key={i} style={{ color: i <= safeRating ? t.starFilled : t.starEmpty, fontSize: 16 }}>★</span>
                    ))}
                  </div>
                  <div style={{
                    padding: "5px 14px", borderRadius: 20,
                    background: t.tag, color: t.tagText,
                    fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                  }}>{ratingMeta.word}</div>
                </div>
                {/* Vertical divider */}
                <div style={{ width: 1, alignSelf: "stretch", background: t.border }} />
                {/* Right column */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, height: "100%", justifyContent: "center" }}>
                  <div>
                    <div style={{ color: t.primary, fontSize: 24, fontWeight: 800, lineHeight: 1.15 }}>{trunc(reviewData.songName, 28)}</div>
                    <div style={{ color: t.secondary, fontSize: 14, marginTop: 5 }}>{trunc(reviewData.artistName, 26)}</div>
                    <div style={{ color: t.tertiary, fontSize: 12, marginTop: 2 }}>{trunc(reviewData.albumName, 32)}</div>
                  </div>
                  <div style={{ height: 1, background: t.border }} />
                  <div style={{ color: t.primary, fontSize: 14, lineHeight: 1.7, fontStyle: "italic" }}>"{trunc(cleanText, 260)}"</div>
                  <div style={{ marginTop: "auto" }}>
                    <div style={{ color: t.primary, fontSize: 13, fontWeight: 700 }}>@{reviewData.username || "user"}</div>
                    <div style={{ color: t.tertiary, fontSize: 11 }}>{fmtDate(reviewData.reviewDate)}</div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ReviewCardGenerator({ reviewData, isOpen, onClose }: ReviewCardGeneratorProps) {
  const [themeKey, setThemeKey] = useState<ThemeKey>("obsidian")
  const [layout, setLayout] = useState<LayoutKey>("cinematic")
  const [fontKey, setFontKey] = useState<FontKey>("satoshi")
  const [sizeKey, setSizeKey] = useState<SizeKey>("story")
  const [showRatingBadge, setShowRatingBadge] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(null), 3500); return () => clearTimeout(t) }
  }, [toast])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isMobile = windowWidth <= 768
  const previewMaxWidth = isMobile ? windowWidth - 40 : 460

  const theme = THEMES[themeKey]
  const font = FONTS[fontKey]
  const size = SIZES[sizeKey]

  const download = useCallback(async () => {
    if (!cardRef.current) return
    setIsGenerating(true)
    try {
      await new Promise(r => setTimeout(r, 600))
      const canvas = await toCanvas(cardRef.current, {
        quality: 1, pixelRatio: 2,
        width: size.w, height: size.h,
        backgroundColor: "#000",
        // @ts-expect-error
        useCORS: true, allowTaint: true,
      })
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `beatshelf-${(reviewData.songName || "review").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(url)
        setToast({ msg: "Card downloaded! 🎉", type: "ok" })
      }, "image/png", 1)
    } catch {
      try {
        const url = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2, width: size.w, height: size.h, backgroundColor: "#000", cacheBust: true })
        const a = document.createElement("a"); a.href = url
        a.download = `beatshelf-${(reviewData.songName || "review").replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`
        a.click()
        setToast({ msg: "Card downloaded! 🎉", type: "ok" })
      } catch {
        setToast({ msg: "Download failed. Try another browser.", type: "err" })
      }
    } finally { setIsGenerating(false) }
  }, [size, reviewData.songName])

  if (!isOpen) return null

  const renderPreviewNode = () => (
    <div style={{
      flex: isMobile ? "none" : 1, padding: isMobile ? "24px 16px" : 32, overflowY: "auto",
      display: "flex", flexDirection: "column", alignItems: "center",
      background: "repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(255,255,255,0.012) 10px,rgba(255,255,255,0.012) 20px)",
      borderBottom: isMobile ? "1px solid rgba(255,255,255,0.06)" : "none",
      minHeight: isMobile ? "40vh" : undefined,
    }}>
      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
        Preview — {size.label}
      </div>
      <CardPreview
        cardRef={cardRef}
        reviewData={reviewData}
        theme={theme}
        layout={layout}
        font={font}
        size={size}
        showRatingBadge={showRatingBadge}
        previewMaxWidth={previewMaxWidth}
      />
    </div>
  )

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: isMobile ? 0 : 16, overflowY: "auto",
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "ok" ? "#16a34a" : "#dc2626",
          color: "#fff", padding: "10px 20px", borderRadius: 12,
          fontSize: 14, fontWeight: 600, zIndex: 10000,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>{toast.msg}</div>
      )}

      <div style={{
        width: "100%", maxWidth: 1100,
        background: "#0a0a0a",
        border: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
        borderRadius: isMobile ? 0 : 24,
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
        display: "flex", flexDirection: "column",
        maxHeight: isMobile ? "100vh" : "calc(100vh - 32px)",
        height: isMobile ? "100vh" : "auto",
        fontFamily: "'Satoshi','DM Sans',sans-serif",
      }}>

        {/* Header */}
        <div style={{
          padding: isMobile ? "16px 20px" : "20px 28px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg,#ef4444,#dc2626)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 900, color: "#fff",
            }}>B</div>
            <div>
              <div style={{ color: "#fff", fontSize: 16, fontWeight: 700 }}>Card Generator</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Create shareable review cards</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "hidden", flex: 1, minHeight: 0 }}>

          {isMobile && renderPreviewNode()}

          {/* Controls Sidebar */}
          <div style={{
            width: isMobile ? "100%" : 280, flexShrink: 0,
            borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.06)",
            padding: isMobile ? "24px 16px" : "24px 20px",
            overflowY: "auto",
            display: "flex", flexDirection: "column", gap: isMobile ? 24 : 28,
            background: "#050505",
            flex: isMobile ? 1 : undefined,
          }}>

            {/* Theme */}
            <section>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Theme</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([k, th]) => (
                  <button key={k} onClick={() => setThemeKey(k)} style={{
                    padding: "10px 12px", borderRadius: 12,
                    background: themeKey === k ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                    border: themeKey === k ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.07)",
                    color: themeKey === k ? "#fff" : "rgba(255,255,255,0.5)",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}>
                    <span>{th.label}</span><span>{th.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Layout */}
            <section>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Layout</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.entries(LAYOUTS) as [LayoutKey, typeof LAYOUTS[LayoutKey]][]).map(([k, l]) => (
                  <button key={k} onClick={() => setLayout(k)} style={{
                    padding: "10px 14px", borderRadius: 10,
                    background: layout === k ? "rgba(255,255,255,0.08)" : "transparent",
                    border: layout === k ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                    color: layout === k ? "#fff" : "rgba(255,255,255,0.45)",
                    cursor: "pointer", fontSize: 13, fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
                    fontFamily: "inherit", textAlign: "left",
                  }}>
                    <span style={{ fontSize: 16 }}>{l.icon}</span><span>{l.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Font */}
            <section>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Font</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.entries(FONTS) as [FontKey, typeof FONTS[FontKey]][]).map(([k, f]) => (
                  <button key={k} onClick={() => setFontKey(k)} style={{
                    padding: "9px 14px", borderRadius: 10,
                    background: fontKey === k ? "rgba(255,255,255,0.08)" : "transparent",
                    border: fontKey === k ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                    color: fontKey === k ? "#fff" : "rgba(255,255,255,0.45)",
                    cursor: "pointer", fontSize: 12, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s",
                    fontFamily: f.stack,
                  }}>
                    <span>{f.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: fontKey === k ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)" }}>{f.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Size */}
            <section>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Export Size</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {(Object.entries(SIZES) as [SizeKey, typeof SIZES[SizeKey]][]).map(([k, s]) => (
                  <button key={k} onClick={() => setSizeKey(k)} style={{
                    padding: "9px 14px", borderRadius: 10,
                    background: sizeKey === k ? "rgba(255,255,255,0.08)" : "transparent",
                    border: sizeKey === k ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                    color: sizeKey === k ? "#fff" : "rgba(255,255,255,0.45)",
                    cursor: "pointer", fontSize: 12, fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s",
                    fontFamily: "inherit",
                  }}>
                    <span style={{ fontSize: 15 }}>{s.icon}</span><span>{s.label}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{s.w}×{s.h}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Toggle */}
            <section>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>Options</div>
              <div style={{
                padding: "12px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Rating Badge</span>
                <div
                  onClick={() => setShowRatingBadge(p => !p)}
                  style={{
                    width: 40, height: 22, borderRadius: 11,
                    background: showRatingBadge ? "#ef4444" : "rgba(255,255,255,0.1)",
                    cursor: "pointer", position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    position: "absolute", top: 3, left: showRatingBadge ? 21 : 3,
                    width: 16, height: 16, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }} />
                </div>
              </div>
            </section>

            {/* Download */}
            <button
              onClick={download}
              disabled={isGenerating}
              style={{
                padding: "14px 20px", borderRadius: 12,
                background: isGenerating ? "rgba(239,68,68,0.4)" : "linear-gradient(135deg,#ef4444,#dc2626)",
                border: "none", color: "#fff", cursor: isGenerating ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 700, letterSpacing: "0.02em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: isGenerating ? "none" : "0 8px 24px rgba(239,68,68,0.35)",
                transition: "all 0.2s", fontFamily: "inherit",
              }}
            >
              {isGenerating ? (
                <><span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 16 }}>⟳</span> Generating…</>
              ) : (
                <>↓ Download Card</>
              )}
            </button>
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 11 }}>
              PNG · 2× resolution · {size.w * 2}×{size.h * 2}px
            </div>
          </div>

          {!isMobile && renderPreviewNode()}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}