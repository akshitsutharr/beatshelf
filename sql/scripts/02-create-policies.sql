-- This script creates policies to enforce data integrity and security.

-- Policies for the 'movies' table

-- Policy to ensure that only authenticated users can insert new movies
CREATE POLICY insert_movies_policy ON movies
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy to ensure that only authenticated users can update movies
CREATE POLICY update_movies_policy ON movies
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy to ensure that only authenticated users can delete movies
CREATE POLICY delete_movies_policy ON movies
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Policy to ensure that only authenticated users can select movies
CREATE POLICY select_movies_policy ON movies
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policies for the 'reviews' table

-- Policy to ensure that only authenticated users can insert new reviews
CREATE POLICY insert_reviews_policy ON reviews
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Policy to ensure that only authenticated users can update their own reviews
CREATE POLICY update_reviews_policy ON reviews
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to ensure that only authenticated users can delete their own reviews
CREATE POLICY delete_reviews_policy ON reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- Policy to ensure that only authenticated users can select reviews
CREATE POLICY select_reviews_policy ON reviews
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Assuming there's a check constraint on the 'reviews' table for the 'rating' column,
-- we need to update it.  If it doesn't exist, we'll add one.
-- First, we drop the existing constraint if it exists.
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;

-- Then, we add the updated constraint.
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check CHECK (rating >= 1.0 AND rating <= 5.0);
