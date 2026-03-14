-- MAPMINGLE PHASE 5 SCHEMA UPDATES
-- Adds support for nested comment replies and comment likes

-- 1. Add parent_id to existing comments table for threading
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;

-- 2. Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (comment_id, user_id)
);

-- Enable RLS on comment_likes
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 3. Policies for comment_likes
CREATE POLICY "Anyone can view comment likes" 
ON public.comment_likes FOR SELECT 
USING (true);

CREATE POLICY "Users can like comments" 
ON public.comment_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own comment likes" 
ON public.comment_likes FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Update existing policies if necessary (Comments are already readable by all)
-- No changes needed for existing comment policies, as parent_id is just an optional foreign key
