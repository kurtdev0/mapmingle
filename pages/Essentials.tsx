import React, { useState, useEffect } from 'react';
import { Droplet, AlertTriangle, CheckCircle, Search, MapPin, Plus, Star, MessageSquare } from 'lucide-react';
import * as Gemini from '../services/geminiService';
import { dbServices } from '../services/dbServices';
import { WaterSafetyInfo, EssentialsLocation } from '../types';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Modal from '../components/Modal';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons for better UX
const waterIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const toiletIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks for adding new locations
const MapEvents = ({ onMapClick }: { onMapClick: (latlng: L.LatLng) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

const Essentials: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'water_fountain' | 'public_toilet'>('water_fountain');
  const [locationStr, setLocationStr] = useState('');
  const [waterSafety, setWaterSafety] = useState<WaterSafetyInfo | null>(null);
  const [loadingSafety, setLoadingSafety] = useState(false);
  
  const [locations, setLocations] = useState<EssentialsLocation[]>([]);
  const [osmLocations, setOsmLocations] = useState<EssentialsLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.9028, 12.4964]);

  // Add flow state
  const [isAddMode, setIsAddMode] = useState(false);
  const [newLocationCoords, setNewLocationCoords] = useState<L.LatLng | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDesc, setNewLocationDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Reviews state
  const [selectedLocForReview, setSelectedLocForReview] = useState<EssentialsLocation | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    loadLocations();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await dbServices.getSession();
    setIsLoggedIn(!!session?.user);
  };

  const loadLocations = async () => {
    setLoadingLocations(true);
    try {
      const data = await dbServices.getEssentialsLocations();
      setLocations(data);
    } catch (err) {
      console.error("Failed to load essentials from DB", err);
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchOsmData = async (lat: number, lng: number) => {
    try {
      // Overpass API query for drinking water and toilets around the center (radius 3000m)
      const radius = 3000;
      const query = `
        [out:json];
        (
          node["amenity"="drinking_water"](around:${radius},${lat},${lng});
          node["amenity"="toilets"](around:${radius},${lat},${lng});
        );
        out body;
      `;
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      const data = await response.json();
      
      const formatted: EssentialsLocation[] = data.elements.map((el: any) => ({
        id: `osm-${el.id}`,
        type: el.tags.amenity === 'drinking_water' ? 'water_fountain' : 'public_toilet',
        lat: el.lat,
        lng: el.lon,
        name: el.tags.name || (el.tags.amenity === 'drinking_water' ? 'Public Drinking Water' : 'Public Toilet'),
        description: 'Sourced from OpenStreetMap public records.',
        isVerified: true
      }));
      setOsmLocations(formatted);
    } catch (error) {
        console.error("Failed to fetch from OSM", error);
    }
  };

  // Helper component to track map center moves to fetch OSM data
  const MapCenterTracker = () => {
      const map = useMapEvents({
          moveend() {
              const center = map.getCenter();
              setMapCenter([center.lat, center.lng]);
              fetchOsmData(center.lat, center.lng);
          }
      });
      // Initial fetch based on default center
      useEffect(() => {
          fetchOsmData(mapCenter[0], mapCenter[1]);
      }, []);
      return null;
  };

  const handleSearchSafety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationStr) return;
    setLoadingSafety(true);
    setWaterSafety(null);

    // 1. Geocode the location to pan the map
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}`);
        const data = await res.json();
        if (data && data.length > 0) {
            setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
    } catch (e) {
        console.warn("Could not geocode search string");
    }

    // 2. Check water safety
    try {
      const safety = await Gemini.getWaterSafety(locationStr);
      setWaterSafety(safety);
    } catch (err) {
      console.warn("API Error, providing mock essentials", err);
      setWaterSafety({ isSafe: false, details: `Safety data could not be verified for ${locationStr} at this time. Please try again.`, locations: [] });
    } finally {
      setLoadingSafety(false);
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
      if (isAddMode) {
          setNewLocationCoords(latlng);
          setIsAddMode(false);
      }
  };

  const submitNewLocation = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newLocationCoords) return;
      setIsAdding(true);
      try {
          await dbServices.addEssentialsLocation(
              activeTab, 
              newLocationCoords.lat, 
              newLocationCoords.lng, 
              newLocationName, 
              newLocationDesc
          );
          setNewLocationCoords(null);
          setNewLocationName('');
          setNewLocationDesc('');
          loadLocations();
          alert("Location added successfully! Thanks for contributing.");
      } catch (err: any) {
          console.error("Failed to add location", err);
          alert(`Failed to add location: ${err?.message || "Are you logged in?"}`);
      } finally {
          setIsAdding(false);
      }
  };

  const openReviewModal = async (loc: EssentialsLocation) => {
      setSelectedLocForReview(loc);
      try {
          const data = await dbServices.getEssentialsReviews(loc.id.toString());
          setReviews(data);
      } catch (err) {
          console.error(err);
      }
  };

  const submitReview = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedLocForReview) return;
      setIsSubmittingReview(true);
      try {
          const newReview = await dbServices.addEssentialReview(
              selectedLocForReview.id.toString(),
              newReviewRating,
              newReviewComment
          );
          // Optimistic update
          const profile = await dbServices.getCurrentProfile();
          setReviews([{...newReview, profiles: {name: profile?.name, avatar_url: profile?.avatar_url}}, ...reviews]);
          // Optimistic update for the marker rating preview
          setLocations(prev => prev.map(loc => {
              if (loc.id === selectedLocForReview.id) {
                  const currentTotal = (loc.averageRating || 0) * (loc.reviewCount || 0);
                  const newCount = (loc.reviewCount || 0) + 1;
                  const newAvg = (currentTotal + newReviewRating) / newCount;
                  return { ...loc, averageRating: newAvg, reviewCount: newCount };
              }
              return loc;
          }));
          setOsmLocations(prev => prev.map(loc => {
              if (loc.id === selectedLocForReview.id) {
                  const currentTotal = (loc.averageRating || 0) * (loc.reviewCount || 0);
                  const newCount = (loc.reviewCount || 0) + 1;
                  const newAvg = (currentTotal + newReviewRating) / newCount;
                  return { ...loc, averageRating: newAvg, reviewCount: newCount };
              }
              return loc;
          }));

          setNewReviewComment('');
          setNewReviewRating(5);
          alert('Review added!');
      } catch (err: any) {
          console.error(err);
          alert(`Failed to add review: ${err?.message || 'Are you logged in?'}`);
      } finally {
          setIsSubmittingReview(false);
      }
  };

  const filteredLocations = [...locations, ...osmLocations].filter(loc => loc.type === activeTab);

  return (
    <div className="relative w-full h-[calc(100vh-80px)] flex flex-col md:flex-row font-sans">
      
      {/* Side Panel */}
      <div className="w-full md:w-[400px] h-full bg-white shadow-2xl z-[1000] flex flex-col border-r border-gray-100">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">Essentials</h1>
              <p className="text-gray-500 text-sm mb-6">Locate clean water sources and public restrooms contributed by travelers.</p>
              
              <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                  <button
                      onClick={() => setActiveTab('water_fountain')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2 ${
                          activeTab === 'water_fountain' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                      <Droplet size={16} /> Water
                  </button>
                  <button
                      onClick={() => setActiveTab('public_toilet')}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex justify-center items-center gap-2 ${
                          activeTab === 'public_toilet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                      }`}
                  >
                      <MapPin size={16} /> Toilets
                  </button>
              </div>

              {isLoggedIn ? (
                  <button 
                      onClick={() => {
                          setIsAddMode(!isAddMode);
                          setNewLocationCoords(null);
                      }}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors ${
                          isAddMode 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                          : 'bg-black text-white hover:bg-gray-800 shadow-md shadow-black/10'
                      }`}
                  >
                      {isAddMode ? 'Cancel Selection' : <><Plus size={18} /> Add New {activeTab === 'water_fountain' ? 'Water Source' : 'Toilet'}</>}
                  </button>
              ) : (
                  <div className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 text-center font-bold text-sm">
                      Log in to add new locations
                  </div>
              )}
              {isAddMode && (
                  <p className="text-xs text-center text-red-500 font-bold mt-3 animate-pulse">
                      Tap anywhere on the map to place a pin
                  </p>
              )}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
               <h3 className="font-bold text-gray-900 mb-4">Water Safety Check</h3>
               <form onSubmit={handleSearchSafety} className="relative flex shadow-sm rounded-xl mb-6">
                  <input 
                      type="text" 
                      className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-sm font-medium"
                      placeholder="Check water safety (e.g. Rome)" 
                      value={locationStr}
                      onChange={(e) => setLocationStr(e.target.value)}
                      required
                      minLength={2}
                      maxLength={100}
                  />
                  <button 
                      type="submit"
                      disabled={loadingSafety}
                      className="px-5 rounded-r-xl font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors"
                  >
                      {loadingSafety ? '...' : <Search size={18} />}
                  </button>
              </form>

              {waterSafety && (
                  <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      waterSafety.isSafe ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}>
                      <div className={`mt-0.5 ${waterSafety.isSafe ? 'text-green-600' : 'text-red-600'}`}>
                          {waterSafety.isSafe ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                      </div>
                      <div>
                          <h4 className={`font-bold text-sm mb-1 ${waterSafety.isSafe ? 'text-green-900' : 'text-red-900'}`}>
                              {waterSafety.isSafe ? 'Tap Water Safe' : 'Tap Water Not Safe'}
                          </h4>
                          <p className={`text-xs leading-relaxed ${waterSafety.isSafe ? 'text-green-800' : 'text-red-800'}`}>
                              {waterSafety.details}
                          </p>
                      </div>
                  </div>
              )}

              <div className="mt-8 border-t border-gray-100 pt-6">
                  <h3 className="font-bold text-gray-900 mb-4 tracking-wide text-sm uppercase text-gray-400">Map Legend</h3>
                  <div className="flex items-center gap-3 mb-3">
                      <img src={waterIcon.options.iconUrl} className="w-5 h-8 object-contain" alt="Water" />
                      <span className="text-sm font-medium text-gray-700">Drinking Water Fountain</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <img src={toiletIcon.options.iconUrl} className="w-5 h-8 object-contain" alt="Toilet" />
                      <span className="text-sm font-medium text-gray-700">Public Restroom</span>
                  </div>
              </div>
          </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 h-full relative z-0">
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapEvents onMapClick={handleMapClick} />
            <MapCenterTracker />
            
            {filteredLocations.map(loc => (
                <Marker 
                    key={loc.id} 
                    position={[loc.lat, loc.lng]} 
                    icon={loc.type === 'water_fountain' ? waterIcon : toiletIcon}
                >
                    <Popup className="essentials-popup">
                        <div className="font-bold text-gray-900">{loc.name || (loc.type === 'water_fountain' ? 'Water Fountain' : 'Public Toilet')}</div>
                        <div className="flex items-center mt-1">
                            <Star className={`w-3 h-3 ${loc.reviewCount && loc.reviewCount > 0 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            <span className="text-xs font-bold ml-1 text-gray-700">
                                {loc.reviewCount && loc.reviewCount > 0 ? loc.averageRating?.toFixed(1) : 'New'}
                            </span>
                            <span className="text-xs text-gray-400 ml-1">({loc.reviewCount || 0})</span>
                        </div>
                        {loc.description && <div className="text-sm text-gray-600 mt-1">{loc.description}</div>}
                        <div className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide">
                            {loc.id.toString().startsWith('osm-') ? 'OpenStreetMap Data' : 'Community Contributed'}
                        </div>
                        <button 
                            onClick={() => openReviewModal(loc)}
                            className="mt-3 w-full py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-1 transition-colors"
                        >
                            <MessageSquare size={12} /> {loc.averageRating ? 'See Reviews' : 'Leave a Review'}
                        </button>
                    </Popup>
                </Marker>
            ))}
            
          </MapContainer>
          {isAddMode && (
              <div className="absolute inset-0 border-4 border-red-500 border-dashed pointer-events-none z-[400] bg-red-500/5"></div>
          )}
      </div>

      {/* Add New Location Modal */}
      <Modal isOpen={!!newLocationCoords} onClose={() => setNewLocationCoords(null)} title={`Add ${activeTab === 'water_fountain' ? 'Water Source' : 'Public Toilet'}`}>
          <form onSubmit={submitNewLocation} className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 mb-2">You selected coordinates: {newLocationCoords?.lat.toFixed(4)}, {newLocationCoords?.lng.toFixed(4)}</p>
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Name / Title (Optional)</label>
                  <input type="text" maxLength={100} value={newLocationName} onChange={e => setNewLocationName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Trevi Fountain Drinking Water"/>
              </div>
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description (Optional)</label>
                  <textarea maxLength={400} value={newLocationDesc} onChange={e => setNewLocationDesc(e.target.value)} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Free, clean and cold! Located behind the main statue."></textarea>
              </div>
              <button type="submit" disabled={isAdding} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-50 mt-2">
                  {isAdding ? 'Adding...' : 'Confirm Location'}
              </button>
          </form>
      </Modal>

      <Modal isOpen={!!selectedLocForReview} onClose={() => setSelectedLocForReview(null)} title={`Reviews for ${selectedLocForReview?.name || 'this location'}`}>
          <div className="space-y-6">
              {isLoggedIn ? (
                  <form onSubmit={submitReview} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h4 className="font-bold text-gray-900 mb-2">Leave a Review</h4>
                      <div className="flex gap-1 mb-3">
                          {[1,2,3,4,5].map(star => (
                              <Star 
                                  key={star} 
                                  size={24} 
                                  onClick={() => setNewReviewRating(star)}
                                  className={`cursor-pointer ${star <= newReviewRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                          ))}
                      </div>
                      <textarea 
                          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none mb-3"
                          placeholder="Share your experience (e.g., 'Very clean', 'Water is cold')..."
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          rows={3}
                          required
                      />
                      <button 
                          type="submit" 
                          disabled={isSubmittingReview}
                          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
                      >
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                  </form>
              ) : (
                  <div className="bg-gray-50 p-4 rounded-xl text-center text-sm text-gray-500 font-medium border border-gray-100">
                      Log in to leave a review.
                  </div>
              )}

              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {reviews.length > 0 ? reviews.map((rev, idx) => (
                      <div key={idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2 mb-2">
                              <img src={rev.profiles?.avatar_url || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full" alt="User" />
                              <div>
                                  <div className="font-bold text-sm text-gray-900">{rev.profiles?.name || 'Anonymous'}</div>
                                  <div className="flex text-yellow-400">
                                      {[...Array(rev.rating)].map((_, i) => <Star key={i} size={12} className="fill-current" />)}
                                  </div>
                              </div>
                          </div>
                          <p className="text-sm text-gray-700">{rev.comment}</p>
                      </div>
                  )) : (
                      <div className="text-center py-4 text-gray-500 text-sm">No reviews yet. Be the first!</div>
                  )}
              </div>
          </div>
      </Modal>

      <style>{`
        .essentials-popup .leaflet-popup-content-wrapper {
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 4px;
        }
      `}</style>
    </div>
  );
};

export default Essentials;
