import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { Star, MapPin, Navigation, Info, Heart, Share2, Compass, Droplet, ExternalLink } from 'lucide-react';
import Modal from './Modal';
import { dbServices } from '../services/dbServices';

interface PlaceCardProps {
  place: Place;
  compact?: boolean;
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place, compact = false }) => {
  const imageUrl = place.photoUrl;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if place is already saved on mount
  useEffect(() => {
     const checkSaved = async () => {
         try {
             const savedPlaces = await dbServices.getSavedPlaces();
             const found = savedPlaces.some(p => p.name === place.name);
             setIsSaved(found);
         } catch (err) {
             console.error("Failed to check saved status:", err);
         }
     };
     checkSaved();
  }, [place.name]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving) return;

    setIsSaving(true);
    // Optimistic UI update
    const newSavedStatus = !isSaved;
    setIsSaved(newSavedStatus);

    try {
        await dbServices.toggleSavedPlace(place, !newSavedStatus);
    } catch (err) {
        console.error("Failed to save place:", err);
        // Revert on error
        setIsSaved(!newSavedStatus);
        alert("Failed to save place. Are you logged in?");
    } finally {
        setIsSaving(false);
    }
  };

  const getSourceIcon = () => {
     if (place.source === 'google') return <MapPin size={14} className="text-red-500" />;
     if (place.source === 'instagram') return <Compass size={14} className="text-pink-500" />;
     if (place.source === 'toilet') return <Droplet size={14} className="text-blue-500" />;
     return <Info size={14} className="text-gray-500" />;
  };

  const handleShare = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsShareModalOpen(true);
  };

  return (
    <>
    <div 
        onClick={() => setIsModalOpen(true)}
        className="group bg-white rounded-2xl shadow-[0_2px_12px_-3px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_40px_-5px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer hover:-translate-y-1"
    >
      <div className={`relative ${compact ? 'h-40' : 'h-64'} overflow-hidden bg-gray-50`}>
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
             <svg className="w-12 h-12 opacity-20" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
        </div>
        <img
          src={imageUrl}
          alt={place.name}
          className="relative w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
          onError={(e) => {
              (e.target as HTMLImageElement).src = `https://loremflickr.com/800/600/landmark?random=${Math.random()}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-70" />
        
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
           {getSourceIcon()}
           <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">
               {place.source === 'toilet' ? 'Restroom' : place.source}
           </span>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
            {place.rating && (
            <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold flex items-center shadow-sm text-gray-900 border border-white/50">
                <Star className="w-3.5 h-3.5 text-yellow-500 mr-1 fill-current" />
                {place.rating.toFixed(1)}
            </div>
            )}
            <button 
                onClick={handleSaveToggle}
                disabled={isSaving}
                className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-white/50 flex items-center justify-center transition-transform active:scale-90"
            >
                <Heart size={16} className={`${isSaved ? "fill-red-500 text-red-500" : "text-gray-600"} ${isSaving ? 'opacity-50' : ''}`} />
            </button>
             <button 
                onClick={handleShare} 
                className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-sm border border-white/50 flex items-center justify-center hover:bg-white transition-colors"
            >
                <Share2 size={16} className="text-gray-600" />
            </button>
        </div>
        
        <div className="absolute bottom-3 left-3 right-3">
             <h3 className="font-serif font-bold text-white text-xl line-clamp-1 drop-shadow-md">{place.name}</h3>
            {place.tags && place.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
                {place.tags.slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 bg-white/20 backdrop-blur-md text-white rounded-full font-medium uppercase tracking-wide border border-white/20">
                    {tag}
                </span>
                ))}
            </div>
            )}
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-grow relative bg-white">
        
        {place.address && (
          <div className="flex items-start text-gray-500 text-sm mb-4">
            <MapPin size={16} className="mt-0.5 mr-2 flex-shrink-0 text-indigo-500" />
            <p className="line-clamp-2 leading-relaxed">{place.address}</p>
          </div>
        )}

        {place.uri && (
          <div className="mt-auto pt-2 border-t border-gray-50">
            <a
                href={place.uri}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center w-full py-2.5 text-xs font-bold text-gray-600 hover:text-indigo-600 tracking-wide uppercase transition-colors"
            >
                View on Map <ExternalLink size={12} className="ml-1.5" />
            </a>
          </div>
        )}
      </div>
    </div>
    
    <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share Location">
        <div className="flex flex-col gap-4">
            <p className="text-gray-600 mb-2">Share <strong>{place.name}</strong> with your friends.</p>
            <div className="flex gap-4 items-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer text-gray-900">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-full"><Share2 size={20}/></div>
                <span className="font-medium">Share via SMS</span>
            </div>
            <div className="flex gap-4 items-center p-3 border rounded-xl hover:bg-gray-50 cursor-pointer text-gray-900">
                <div className="bg-gray-100 text-gray-600 p-2 rounded-full"><Share2 size={20}/></div>
                <span className="font-medium">Copy Link</span>
            </div>
        </div>
    </Modal>
    </>
  );
};

export default PlaceCard;
