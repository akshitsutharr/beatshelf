"use client"

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring } from "framer-motion"
import { Disc3, Mic2 } from "lucide-react"

export type LivingWallItem = {
  id: string
  title: string
  subtitle: string
  image: string
  href: string
  kind: "song" | "album"
}

type LaneConfig = {
  speed: number
  direction: "left" | "right"
  diagonal: boolean
  top: string
  opacity: string
}

function cycleSlice<T>(list: T[], start: number, count: number) {
  if (list.length === 0) return []

  return Array.from({ length: count }, (_, idx) => list[(start + idx) % list.length])
}

function MagneticPosterCard({
  item,
  index,
  magneticEnabled,
}: {
  item: LivingWallItem
  index: number
  magneticEnabled: boolean
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 140, damping: 18, mass: 0.3 })
  const springY = useSpring(y, { stiffness: 140, damping: 18, mass: 0.3 })

  const onMove = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!magneticEnabled) return

    const rect = event.currentTarget.getBoundingClientRect()
    const px = (event.clientX - rect.left - rect.width / 2) / rect.width
    const py = (event.clientY - rect.top - rect.height / 2) / rect.height
    x.set(px * 18)
    y.set(py * 16)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      whileHover={magneticEnabled ? { scale: 1.06, zIndex: 30 } : { scale: 1.02, zIndex: 20 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      className={`shrink-0 ${index % 5 === 0 ? "-mt-4" : ""} ${index % 4 === 0 ? "scale-[0.96]" : ""}`}
    >
      <Link
        href={item.href}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group relative block w-[154px] sm:w-[170px] md:w-[188px] overflow-hidden rounded-[1.35rem] border border-white/15 bg-black/45 shadow-[0_24px_42px_rgba(0,0,0,0.42)] transition-all duration-500"
      >
        <div className="relative aspect-[3/4]">
          <Image
            src={item.image}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 154px, (max-width: 768px) 170px, 188px"
            className="object-cover saturate-[0.9] transition-all duration-700 group-hover:scale-110 group-hover:saturate-[1.08]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.78)_75%,rgba(0,0,0,0.94)_100%)]" />
        </div>

        <div className="absolute left-2.5 top-2.5 rounded-full border border-white/25 bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/75">
          {item.kind}
        </div>

        <div className="absolute inset-x-3 bottom-3">
          <p className="text-[13px] font-medium leading-tight line-clamp-2 text-white/96">{item.title}</p>
          <p className="mt-1 text-[11px] text-white/66 line-clamp-1">{item.subtitle}</p>
        </div>

        <div className="absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-black/70 px-2.5 py-1 text-[10px] text-white/84">
            {item.kind === "song" ? <Mic2 className="h-3 w-3" /> : <Disc3 className="h-3 w-3" />}
            Open thread
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function LivingMusicWall({ items }: { items: LivingWallItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const laneRefs = useRef<Array<HTMLDivElement | null>>([])
  const laneWidths = useRef<number[]>([1, 1, 1])
  const laneOffsets = useRef<number[]>([0, 0, 0])
  const [isInteracting, setIsInteracting] = useState(false)
  const [isCoarsePointer, setIsCoarsePointer] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isInView, setIsInView] = useState(true)
  const prefersReducedMotion = useReducedMotion()

  const safeItems = useMemo(() => {
    if (items.length > 0) return items

    return [
      {
        id: "fallback-1",
        title: "No tracks yet",
        subtitle: "New updates will appear here",
        image: "/placeholder.svg?height=800&width=600",
        href: "/explore",
        kind: "song" as const,
      },
    ]
  }, [items])

  const lanes = useMemo(() => {
    const laneConfigs: LaneConfig[] = isMobile
      ? [
          { speed: 12, direction: "left", diagonal: false, top: "10%", opacity: "opacity-95" },
          { speed: 10, direction: "right", diagonal: true, top: "50%", opacity: "opacity-90" },
        ]
      : [
          { speed: 20, direction: "left", diagonal: false, top: "7%", opacity: "opacity-95" },
          { speed: 15, direction: "right", diagonal: false, top: "36%", opacity: "opacity-85" },
          { speed: 24, direction: "left", diagonal: true, top: "66%", opacity: "opacity-90" },
        ]

    const laneItemCount = isMobile ? 6 : 8

    return laneConfigs.map((config, idx) => ({
      ...config,
      items: cycleSlice(safeItems, idx * 3, laneItemCount),
    }))
  }, [safeItems, isMobile])

  useEffect(() => {
    if (typeof window === "undefined") return

    const coarse = window.matchMedia("(pointer: coarse)")
    const mobile = window.matchMedia("(max-width: 767px)")

    const apply = () => {
      setIsCoarsePointer(coarse.matches)
      setIsMobile(mobile.matches)
    }

    apply()

    coarse.addEventListener("change", apply)
    mobile.addEventListener("change", apply)

    return () => {
      coarse.removeEventListener("change", apply)
      mobile.removeEventListener("change", apply)
    }
  }, [])

  useEffect(() => {
    if (!rootRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    observer.observe(rootRef.current)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const measure = () => {
      laneWidths.current = laneRefs.current.map((lane) => {
        if (!lane) return 1
        return Math.max(1, lane.scrollWidth / 2)
      })
    }

    measure()

    const observer = new ResizeObserver(measure)
    if (rootRef.current) observer.observe(rootRef.current)

    return () => observer.disconnect()
  }, [lanes])

  useAnimationFrame((timestamp, delta) => {
    if (prefersReducedMotion || !isInView) return

    const slowdown = isInteracting ? 0.32 : 1

    lanes.forEach((lane, idx) => {
      const laneElement = laneRefs.current[idx]
      if (!laneElement) return

      const width = laneWidths.current[idx] || 1
      const velocity = lane.speed * (delta / 1000) * slowdown
      laneOffsets.current[idx] = (laneOffsets.current[idx] + velocity) % width

      const offset = laneOffsets.current[idx]
      const horizontal = lane.direction === "left" ? -offset : offset
      const ambient = Math.sin(timestamp / 1800 + idx) * 5
      const vertical = lane.diagonal ? (lane.direction === "left" ? offset * 0.12 : -offset * 0.1) : ambient

      laneElement.style.transform = `translate3d(${horizontal}px, ${vertical}px, 0)`
    })
  })

  return (
    <section className="space-y-5">
      <div className="max-w-3xl">
        <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">kinetic gallery</p>
        <h2 className="mt-2 text-3xl md:text-5xl font-semibold leading-[0.95] tracking-[-0.03em]">
          living music wall
        </h2>
        <p className="mt-3 text-sm md:text-base text-white/62 max-w-[58ch]">
          A continuous collage of songs and albums drifting at different depths. Hover into any poster to bring it
          forward and jump straight into the conversation.
        </p>
      </div>

      <div
        ref={rootRef}
        onMouseEnter={() => {
          if (!isCoarsePointer) setIsInteracting(true)
        }}
        onMouseLeave={() => setIsInteracting(false)}
        className="relative min-h-[460px] sm:min-h-[560px] md:min-h-[760px] overflow-hidden rounded-[1.8rem] sm:rounded-[2.3rem] border border-white/10 bg-black/45 p-2.5 sm:p-3 md:p-4 shadow-[0_24px_70px_rgba(0,0,0,0.45)]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,rgba(255,255,255,0.06),transparent_35%),radial-gradient(circle_at_82%_72%,rgba(239,68,68,0.11),transparent_40%)]" />

        {lanes.map((lane, laneIndex) => (
          <div
            key={`lane-${laneIndex}`}
            style={{ top: lane.top }}
            className={`absolute left-0 right-0 ${lane.opacity} select-none`}
          >
            <div
              ref={(element) => {
                laneRefs.current[laneIndex] = element
              }}
              className="flex w-max gap-3 sm:gap-5 md:gap-6 will-change-transform"
            >
              {[...lane.items, ...lane.items].map((item, index) => (
                <MagneticPosterCard
                  key={`${laneIndex}-${item.id}-${index}`}
                  item={item}
                  index={index}
                  magneticEnabled={!isCoarsePointer}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
      </div>
    </section>
  )
}
