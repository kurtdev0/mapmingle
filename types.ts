export enum UserRole {
  TRAVELER = 'TRAVELER',
  GUIDE = 'GUIDE'
}

export interface Place {
  name: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  uri?: string; // Google Maps link
  description?: string;
  photoUrl?: string; // Placeholder or fetched
  tags?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  is_guide: boolean;
  expertise?: string[];
  created_at: string;
}

export interface GuideProfile {
  id: string;
  name: string;
  username: string;
  expertise: string[];
  bio: string;
  rating: number;
  reviews: number;
  followers: number;
  isFollowing: boolean;
  avatarUrl: string;
  location: string;
  languages: string[];
}

export interface ExaggerationResult {
  placeName: string;
  score: number; // 1-10 (10 being extremely overrated)
  verdict: string;
  reasoning: string;
}

export interface WaterSafetyInfo {
  isSafe: boolean;
  details: string;
  locations: Place[];
}

export interface ItineraryDay {
  day: number;
  morning: string;
  afternoon: string;
  evening: string;
  food: string;
}

export interface FeedPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
    isGuide: boolean;
  };
  location: string;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
}
