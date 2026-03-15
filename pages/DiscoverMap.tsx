import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { dbServices } from '../services/dbServices';
import { FeedPost } from '../types';
import { MapPin, Heart, MessageCircle } from 'lucide-react';

const DiscoverMap: React.FC = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState<FeedPost | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const allPosts = await dbServices.getFeedPosts();
      const mappedPosts = [];
      for (const p of allPosts) {
          if (p.lat && p.lng) {
              mappedPosts.push(p);
          } else if (p.location) {
              // Geocode missing coordinates using Nominatim to put them in the exact real place
              try {
                  // Add a small delay to respect Nominatim API rate limits
                  await new Promise(resolve => setTimeout(resolve, 300));
                  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(p.location)}`);
                  const data = await res.json();
                  if (data && data.length > 0) {
                      mappedPosts.push({ ...p, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                  }
              } catch (e) {
                  console.warn("Geocoding failed for", p.location);
              }
          }
      }
      setPosts(mappedPosts);
    } catch (error) {
      console.error("Failed to load posts for map:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBubbleRadius = (post: FeedPost) => {
    // Determine bubble size based on popularity (likes + comments)
    const score = post.likes + post.comments;
    const base = 8;
    const max = 25;
    return Math.min(base + (score / 2), max);
  };

  return (
    <div className="relative w-full h-[calc(100vh-80px)] overflow-hidden flex">
      {/* Map Area */}
      <div className="flex-1 h-full z-0">
        {loading ? (
          <div className="flex-1 h-full flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <MapContainer 
            center={[41.9028, 12.4964]} 
            zoom={4} 
            className="w-full h-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            {posts.map(post => {
              if (!post.lat || !post.lng) return null;
              const radius = getBubbleRadius(post);
              return (
                <CircleMarker
                  key={post.id}
                  center={[post.lat, post.lng]}
                  radius={radius}
                  pathOptions={{ 
                    color: '#4f46e5', 
                    fillColor: '#4f46e5', 
                    fillOpacity: 0.6,
                    weight: 2
                  }}
                  eventHandlers={{
                    click: () => setActivePost(post)
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="text-center font-bold text-gray-900 border-b pb-1 mb-1">
                      {post.location}
                    </div>
                    <div className="text-xs text-indigo-600 font-bold">
                      {post.likes} Likes • {post.comments} Comments
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        )}
      </div>

      {/* Side Panel for Active Post */}
      <div className={`absolute top-0 right-0 h-full w-full md:w-[400px] bg-white shadow-2xl transition-transform duration-300 transform z-[1000] overflow-y-auto ${activePost ? 'translate-x-0' : 'translate-x-full'}`}>
        {activePost && (
          <div className="p-6">
            <button 
              onClick={() => setActivePost(null)}
              className="mb-4 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Close Panel
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img src={activePost.author.avatarUrl || 'https://via.placeholder.com/150'} alt={activePost.author.name} className="w-12 h-12 rounded-full object-cover" />
              <div>
                <h4 className="font-bold text-gray-900 leading-tight">{activePost.author.name}</h4>
                <p className="text-xs text-indigo-600 font-bold">{activePost.author.isGuide ? 'Local Guide' : 'Traveler'}</p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden mb-4 shadow-sm relative group cursor-pointer border border-gray-100">
               <img src={activePost.imageUrl} alt={activePost.location} className="w-full object-cover aspect-square" />
            </div>

            <div className="flex gap-4 mb-4">
               <button className="flex items-center gap-1.5 text-gray-700 hover:text-red-500 font-bold transition-colors">
                  <Heart size={20} className={activePost.isLiked ? "fill-red-500 text-red-500" : ""} /> {activePost.likes}
               </button>
               <button className="flex items-center gap-1.5 text-gray-700 hover:text-indigo-600 font-bold transition-colors">
                  <MessageCircle size={20} /> {activePost.comments}
               </button>
            </div>

            <div className="mb-2">
               <p className="font-medium text-gray-900"><span className="font-bold mr-2">{activePost.author.name}</span>{activePost.caption}</p>
            </div>
            
            <p className="text-sm font-bold text-indigo-600 mt-4 flex items-center gap-1">
               <MapPin size={16} /> {activePost.location}
            </p>
          </div>
        )}
      </div>

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .custom-popup .leaflet-popup-tip {
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default DiscoverMap;
