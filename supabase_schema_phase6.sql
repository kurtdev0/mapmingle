-- MapMingle Phase 6: Guide Accounts & Expertise Schema Update

-- 1. Add expertise to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS expertise TEXT[] DEFAULT '{}';

-- 2. Create an admin bypass policy (optional, mostly for dev) to freely update expertise
-- We already have "Users can update their own profile" which should cover this.

-- 3. Add an RLS Policy to appointments to allow fetching incoming appointments
-- Previously we only added "Users and Guides can view their appointments", 
-- which already checks (auth.uid() = user_id OR auth.uid() = guide_id). So we're good!

-- Note: We update the status of existing guides to give them generic expertise
UPDATE public.profiles 
SET expertise = ARRAY['City Tours', 'Historical Sites']
WHERE is_guide = true;
