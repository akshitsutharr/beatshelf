-- Safe, non-destructive migration for BeatShelf
-- This file only adds or replaces objects. It does not drop tables or delete data.

BEGIN;

-- Keep get_song_with_stats available for app/song/[id]/page.tsx
CREATE OR REPLACE FUNCTION public.get_song_with_stats(song_id_param TEXT)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  artist_name TEXT,
  album_name TEXT,
  album_image_url TEXT,
  preview_url TEXT,
  duration_ms INTEGER,
  release_date DATE,
  spotify_url TEXT,
  avg_rating DECIMAL,
  total_ratings BIGINT,
  total_reviews BIGINT,
  total_favorites BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    s.artist_name,
    s.album_name,
    s.album_image_url,
    s.preview_url,
    s.duration_ms,
    s.release_date,
    s.spotify_url,
    COALESCE(AVG(r.rating), 0)::DECIMAL AS avg_rating,
    COUNT(DISTINCT r.id) AS total_ratings,
    COUNT(DISTINCT rev.id) AS total_reviews,
    COUNT(DISTINCT f.id) AS total_favorites
  FROM public.songs s
  LEFT JOIN public.ratings r ON s.id = r.song_id
  LEFT JOIN public.reviews rev ON s.id = rev.song_id
  LEFT JOIN public.favorites f ON s.id = f.song_id
  WHERE s.id = song_id_param
  GROUP BY
    s.id,
    s.name,
    s.artist_name,
    s.album_name,
    s.album_image_url,
    s.preview_url,
    s.duration_ms,
    s.release_date,
    s.spotify_url;
END;
$$;

-- Allow app role usage of the RPC from Supabase client calls
GRANT EXECUTE ON FUNCTION public.get_song_with_stats(TEXT) TO anon, authenticated, service_role;

-- Helpful indexes for song stats reads (safe if already present)
CREATE INDEX IF NOT EXISTS idx_ratings_song_id ON public.ratings (song_id);
CREATE INDEX IF NOT EXISTS idx_reviews_song_id ON public.reviews (song_id);
CREATE INDEX IF NOT EXISTS idx_favorites_song_id ON public.favorites (song_id);

COMMIT;
