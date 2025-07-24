-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get song with aggregated data
CREATE OR REPLACE FUNCTION get_song_with_stats(song_id_param TEXT)
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
) AS $$
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
    COALESCE(AVG(r.rating), 0)::DECIMAL as avg_rating,
    COUNT(DISTINCT r.id) as total_ratings,
    COUNT(DISTINCT rev.id) as total_reviews,
    COUNT(DISTINCT f.id) as total_favorites
  FROM public.songs s
  LEFT JOIN public.ratings r ON s.id = r.song_id
  LEFT JOIN public.reviews rev ON s.id = rev.song_id
  LEFT JOIN public.favorites f ON s.id = f.song_id
  WHERE s.id = song_id_param
  GROUP BY s.id, s.name, s.artist_name, s.album_name, s.album_image_url, 
           s.preview_url, s.duration_ms, s.release_date, s.spotify_url;
END;
$$ LANGUAGE plpgsql;
