-- MapMingle Phase 6 Features Schema Update

-- 0. Clean up previous attempts to avoid conflicts
DROP TABLE IF EXISTS public.tour_requests CASCADE;
DROP TABLE IF EXISTS public.tour_packages CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.essentials_locations CASCADE;
DROP TABLE IF EXISTS public.essentials_reviews CASCADE;
DROP TABLE IF EXISTS public.exaggeration_ratings CASCADE;-- 1. Add precise locations (lat, lng) to posts
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS lat DECIMAL,
ADD COLUMN IF NOT EXISTS lng DECIMAL;

-- 2. Add verification to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 3. Create tour_packages table
CREATE TABLE public.tour_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL NOT NULL,
    duration_hours DECIMAL,
    max_people INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tour_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tour packages" 
ON public.tour_packages FOR SELECT USING (true);

CREATE POLICY "Guides can manage their own packages" 
ON public.tour_packages FOR ALL USING (auth.uid() = guide_id);

-- 4. Create tour_requests table
CREATE TABLE public.tour_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID REFERENCES public.tour_packages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    guide_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', -- pending, accepted, rejected, completed
    message TEXT,
    requested_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tour_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own requests" 
ON public.tour_requests FOR SELECT USING (auth.uid() = user_id OR auth.uid() = guide_id);

CREATE POLICY "Users can insert requests" 
ON public.tour_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guides can update request status" 
ON public.tour_requests FOR UPDATE USING (auth.uid() = guide_id);

-- 5. Create messages table for DMs
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages" 
ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages (mark read)" 
ON public.messages FOR UPDATE USING (auth.uid() = receiver_id);

-- 6. Create essentials_locations table (Water & Toilets)
CREATE TABLE public.essentials_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- 'water_fountain', 'public_toilet'
    lat DECIMAL NOT NULL,
    lng DECIMAL NOT NULL,
    name TEXT,
    description TEXT,
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.essentials_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view essentials" 
ON public.essentials_locations FOR SELECT USING (true);

CREATE POLICY "Logged in users can add essentials" 
ON public.essentials_locations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 7. Create exaggeration_ratings table
CREATE TABLE public.exaggeration_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id TEXT NOT NULL, -- we might not have a strict place UUID, string is fine (e.g. Google Place ID or name)
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    waiting_time_score INTEGER NOT NULL CHECK(waiting_time_score BETWEEN 1 AND 10),
    taste_score INTEGER NOT NULL CHECK(taste_score BETWEEN 1 AND 10),
    crowdedness_score INTEGER NOT NULL CHECK(crowdedness_score BETWEEN 1 AND 10),
    view_score INTEGER NOT NULL CHECK(view_score BETWEEN 1 AND 10),
    overall_exaggeration_score DECIMAL, -- computed or average
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(place_id, user_id)
);

ALTER TABLE public.exaggeration_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exaggeration ratings" 
ON public.exaggeration_ratings FOR SELECT USING (true);

CREATE POLICY "Users can add their own exaggeration ratings" 
ON public.exaggeration_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exaggeration ratings" 
ON public.exaggeration_ratings FOR UPDATE USING (auth.uid() = user_id);

-- 8. Create essentials_reviews table
CREATE TABLE public.essentials_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.essentials_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Essentials reviews are viewable by everyone"
ON public.essentials_reviews FOR SELECT USING (true);

CREATE POLICY "Users can insert essentials reviews"
ON public.essentials_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
