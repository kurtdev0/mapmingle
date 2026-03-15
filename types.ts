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
  lat?: number;
  lng?: number;
  source?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  is_guide: boolean;
  is_verified?: boolean;
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
  isVerified?: boolean;
}

export interface ExaggerationResult {
  placeName: string;
  score: number; // 1-10 (10 being extremely overrated)
  verdict: string;
  reasoning: string;
  metrics?: {
    waitingTime: number;
    taste: number;
    crowdedness: number;
    view: number;
    valueForMoney: number;
    accessibility: number;
  };
}

export interface ExaggerationMetrics {
  id: string;
  placeId: string;
  waitingTimeScore: number;
  tasteScore: number;
  crowdednessScore: number;
  viewScore: number;
  overallScore: number;
  comments?: string;
}

export interface WaterSafetyInfo {
  isSafe: boolean;
  details: string;
  locations: Place[];
}

export interface EssentialsLocation {
  id: string;
  type: 'water_fountain' | 'public_toilet';
  lat: number;
  lng: number;
  name?: string;
  description?: string;
  isVerified: boolean;
  addedBy?: string;
  averageRating?: number;
  reviewCount?: number;
}

export interface ItineraryDay {
  day: number;
  morning: string;
  afternoon: string;
  evening: string;
  food: string;
  lat?: number;
  lng?: number;
  locations?: { name: string; lat: number; lng: number; type: string }[];
}

export interface FeedPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string;
    isGuide: boolean;
    isVerified?: boolean;
  };
  location: string;
  lat?: number;
  lng?: number;
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked: boolean;
}

export interface TourPackage {
  id: string;
  guideId: string;
  title: string;
  description: string;
  price: number;
  durationHours: number;
  maxPeople: number;
}

export interface TourRequest {
  id: string;
  packageId: string;
  userId: string;
  guideId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  message: string;
  requestedDate: string;
  package?: TourPackage;
  user?: Partial<UserProfile>;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}
