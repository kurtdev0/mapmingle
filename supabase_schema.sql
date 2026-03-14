-- 1. Create Profiles Table (Users and Guides)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  is_guide BOOLEAN DEFAULT false,
  expertise TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Posts Table (Feed)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Post Likes Table
CREATE TABLE public.post_likes (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

-- 4. Create Comments Table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Follows Table
CREATE TABLE public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);


-- INSERT MOCK PROFILES
INSERT INTO public.profiles (id, name, username, avatar_url, bio, location, is_guide, expertise, languages)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Elena Rossi', '@elena_rome', 'https://i.pravatar.cc/150?u=elena', 'Born and raised in Rome. I know every cobblestone and secret pasta spot in Trastevere.', 'Rome, Italy', true, ARRAY['History', 'Food', 'Nightlife'], ARRAY['Italian', 'English']),
  ('22222222-2222-2222-2222-222222222222', 'Mike Chen', '@mike_chen', 'https://i.pravatar.cc/150?u=mike', 'Just a guy exploring the world, one bowl of noodles at a time.', 'San Francisco, CA', false, ARRAY[]::TEXT[], ARRAY['English', 'Mandarin']),
  ('33333333-3333-3333-3333-333333333333', 'Sarah Jenkins', '@sarah_london', 'https://i.pravatar.cc/150?u=sarah', 'Londoner for 10 years. Expert in finding the best vintage markets and cozy pubs.', 'London, UK', true, ARRAY['Vintage Shopping', 'Pubs', 'Art'], ARRAY['English', 'French']),
  ('44444444-4444-4444-4444-444444444444', 'Kenji Tanaka', '@kenji_kyoto', 'https://i.pravatar.cc/150?u=kenji', 'Photography enthusiast showing you the quiet side of Kyoto before the crowds arrive.', 'Kyoto, Japan', true, ARRAY['Temples', 'Photography', 'Nature'], ARRAY['Japanese', 'English']),
  
  -- The logged in "Mock User" ID for interaction testing
  ('00000000-0000-0000-0000-000000000000', 'Traveler You', '@traveler_you', 'https://i.pravatar.cc/150?u=you', 'I love to travel the world.', 'Earth', false, ARRAY[]::TEXT[], ARRAY['English']);


-- INSERT MOCK POSTS
INSERT INTO public.posts (id, author_id, location, image_url, caption)
VALUES
  ('aaaaa111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Trastevere, Rome', 'https://loremflickr.com/800/800/rome,street', 'Found this incredible little bakery hidden behind the ivy. The Maritozzi here are to die for! 🥐🇮🇹 #HiddenRome #Foodie'),
  ('bbbbb222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Fushimi Inari, Kyoto', 'https://loremflickr.com/800/800/kyoto,temple', 'Pro tip: Go at 6 AM. No crowds, just you and the torii gates. ✨⛩️ #JapanTravel #MorningPerson'),
  ('ccccc333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'Shoreditch, London', 'https://loremflickr.com/800/800/london,art', 'New street art popped up on Brick Lane. The colors are insane! 🎨🇬🇧 #LondonLife #StreetArt');


-- INSERT MOCK LIKES & COMMENTS & FOLLOWS TO PROVE IT WORKS
INSERT INTO public.post_likes (post_id, user_id)
VALUES ('bbbbb222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000');

INSERT INTO public.comments (post_id, author_id, content)
VALUES ('aaaaa111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Is this the spot near Santa Maria? Looks great!');

INSERT INTO public.follows (follower_id, following_id)
VALUES ('00000000-0000-0000-0000-000000000000', '44444444-4444-4444-4444-444444444444');
