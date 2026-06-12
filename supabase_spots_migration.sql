-- Create spots table for storing user-saved map locations
-- This table supports hotspots, meet locations, photo spots, and more

CREATE TABLE IF NOT EXISTS public.spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Meetup', 'Fuel', 'Food', 'Scenic')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_spots_location ON public.spots(latitude, longitude);

-- Create index for filtering by type
CREATE INDEX IF NOT EXISTS idx_spots_type ON public.spots(type);

-- Create index for sorting by creation date
CREATE INDEX IF NOT EXISTS idx_spots_created_at ON public.spots(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read spots (public community map)
CREATE POLICY "Anyone can view spots" ON public.spots
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert spots
CREATE POLICY "Authenticated users can create spots" ON public.spots
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow users to delete their own spots
CREATE POLICY "Users can delete their own spots" ON public.spots
  FOR DELETE
  USING (auth.uid() = created_by);

-- Allow users to update their own spots
CREATE POLICY "Users can update their own spots" ON public.spots
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Grant necessary permissions
GRANT SELECT ON public.spots TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spots TO authenticated;
