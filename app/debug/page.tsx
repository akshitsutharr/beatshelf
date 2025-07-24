import { DebugSpotify } from "@/components/debug-spotify"

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Debug Spotify Integration</h1>
          <p className="text-muted-foreground">Test Spotify API connectivity and token generation</p>
        </div>

        <DebugSpotify />

        <div className="text-center text-sm text-muted-foreground">
          <p>Environment check:</p>
          <p>SPOTIFY_CLIENT_ID: {process.env.SPOTIFY_CLIENT_ID ? "✓ Set" : "✗ Missing"}</p>
          <p>SPOTIFY_CLIENT_SECRET: {process.env.SPOTIFY_CLIENT_SECRET ? "✓ Set" : "✗ Missing"}</p>
        </div>
      </div>
    </div>
  )
}
