import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Album, ArrowLeft, Disc3, Flame, Headphones, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SongCard } from "@/components/song-card"
import { Button } from "@/components/ui/button"
import { formatSpotifyTrackForDB, getArtistProfile } from "@/lib/spotify"

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getArtistProfile(id).catch(() => null)

  if (!data?.artist) {
    notFound()
  }

  const artistImage = data.artist.images?.[0]?.url || "/placeholder.svg?height=900&width=900"

  return (
    <div className="relative min-h-screen bg-[#050608] text-white pb-16 overflow-hidden">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Image src={artistImage} alt={data.artist.name} fill className="object-cover opacity-25 blur-[120px] scale-125" />
        <div className="absolute inset-0 bg-black/75" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        <Button asChild variant="ghost" className="rounded-full text-white/70 hover:text-white hover:bg-white/10">
          <Link href="/artists">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Artists
          </Link>
        </Button>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl p-7 md:p-9">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="relative w-36 h-36 md:w-48 md:h-48 rounded-3xl overflow-hidden border border-white/10 shrink-0">
              <Image src={artistImage} alt={data.artist.name} fill className="object-cover" />
            </div>

            <div className="space-y-4">
              <Badge className="rounded-full bg-orange-500/25 text-orange-200 border-orange-400/40">
                <Flame className="w-3 h-3 mr-1" /> Artist Profile
              </Badge>
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight">{data.artist.name}</h1>
              <div className="flex flex-wrap gap-2">
                {(data.artist.genres || []).slice(0, 4).map((genre) => (
                  <Badge key={genre} className="rounded-full bg-white/10 text-white border-white/20">{genre}</Badge>
                ))}
              </div>
              <p className="text-white/70 text-sm md:text-base">
                {data.artist.followers?.total?.toLocaleString() || "-"} followers · Popularity {data.artist.popularity}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Headphones className="w-5 h-5 text-red-400" /> Top Songs
            </h2>
            <Badge className="rounded-full bg-white/10 text-white border-white/20">{data.topTracks.length} songs</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {data.topTracks.map((track) => (
              <SongCard key={track.id} song={formatSpotifyTrackForDB(track)} showRating={false} />
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Album className="w-5 h-5 text-sky-300" /> Albums & Singles
            </h2>
            <Badge className="rounded-full bg-white/10 text-white border-white/20">{data.albums.length} releases</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {data.albums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="group rounded-2xl border border-white/10 bg-white/[0.05] overflow-hidden hover:bg-white/[0.08] transition-colors"
              >
                <div className="relative aspect-square">
                  <Image
                    src={album.images?.[0]?.url || "/placeholder.svg?height=600&width=600"}
                    alt={album.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm line-clamp-1">{album.name}</p>
                  <p className="text-xs text-white/60 mt-1 line-clamp-1">{album.release_date}</p>
                  <p className="text-xs text-white/45 mt-1 inline-flex items-center gap-1">
                    <Disc3 className="w-3 h-3" /> {album.total_tracks} tracks
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {data.artist.external_urls?.spotify && (
          <section className="text-center">
            <a
              href={data.artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm text-white/85 hover:bg-white/[0.12] transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Open full artist on Spotify
            </a>
          </section>
        )}
      </div>
    </div>
  )
}
