"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function DebugSpotify() {
  const [trackId, setTrackId] = useState("7MNrrItJpom6uMJWdT0XD8")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testToken = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/spotify/token")
      const data = await response.json()
      setResult({ type: "token", data })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const testTrack = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/spotify/track/${trackId}`)
      const data = await response.json()
      setResult({ type: "track", data })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Spotify API Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testToken} disabled={loading}>
            Test Token
          </Button>
          <Input
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            placeholder="Track ID"
            className="flex-1"
          />
          <Button onClick={testTrack} disabled={loading}>
            Test Track
          </Button>
        </div>

        {loading && <Badge>Loading...</Badge>}
        {error && <Badge variant="destructive">Error: {error}</Badge>}

        {result && (
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Result ({result.type}):</h4>
            <pre className="text-xs overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
