interface SpotifyToken {
  access_token: string
  token_type: string
  expires_in: number
  expires_at: number
}

let cachedToken: SpotifyToken | null = null

export async function getSpotifyToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expires_at > Date.now()) {
    return cachedToken.access_token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("Spotify credentials not configured")
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Spotify token request failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()

    if (!data.access_token) {
      throw new Error("No access token in Spotify response")
    }

    cachedToken = {
      access_token: data.access_token,
      token_type: data.token_type,
      expires_in: data.expires_in,
      expires_at: Date.now() + data.expires_in * 1000 - 60000, // Subtract 1 minute for safety
    }

    return cachedToken.access_token
  } catch (error) {
    console.error("Error getting Spotify token:", error)
    throw error
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  album: {
    name: string
    images: Array<{ url: string; height: number; width: number }>
    release_date: string
  }
  duration_ms: number
  preview_url: string | null
  external_urls: {
    spotify: string
  }
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[]
    total: number
    limit: number
    offset: number
  }
}

export async function searchTracks(query: string, limit = 20, offset = 0): Promise<SpotifySearchResponse> {
  const token = await getSpotifyToken()

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&offset=${offset}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error("Failed to search tracks")
  }

  return response.json()
}

export async function getNewReleases(limit = 20, offset = 0) {
  const token = await getSpotifyToken()

  const response = await fetch(`https://api.spotify.com/v1/browse/new-releases?limit=${limit}&offset=${offset}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get new releases")
  }

  const data = await response.json()
  return data.albums
}

export async function getTrack(trackId: string): Promise<SpotifyTrack> {
  const token = await getSpotifyToken()

  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get track")
  }

  return response.json()
}

export function formatSpotifyTrackForDB(track: SpotifyTrack) {
  return {
    id: track.id,
    name: track.name,
    artist_name: track.artists.map((a) => a.name).join(", "),
    album_name: track.album.name,
    album_image_url: track.album.images[0]?.url || null,
    preview_url: track.preview_url,
    duration_ms: track.duration_ms,
    release_date: track.album.release_date,
    spotify_url: track.external_urls.spotify,
  }
}
