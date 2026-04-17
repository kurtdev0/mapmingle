import React, { useState } from 'react';
import * as Gemini from '../services/geminiService';
import { ItineraryDay } from '../types';
import { Sun, Sunset, Moon, Coffee, Calendar, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Day colors for distinct paths
const DAY_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to change map view dynamically
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const Planner: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([48.8566, 2.3522]); // Default Paris
  const [markers, setMarkers] = useState<{lat: number, lng: number, title: string, day: number}[]>([]);

  const generateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    setLoading(true);
    try {
        const plan = await Gemini.getItinerary(destination, days);
        if (plan && plan.length > 0) {
           setItinerary(plan);
           
           // Calculate average center from returned coordinates, fallback to default if missing
           const allLocations = plan.flatMap(d => d.locations || []);
           const validCoords = allLocations.filter(loc => loc.lat !== undefined && loc.lng !== undefined);
           
           if (validCoords.length > 0) {
               const centerLat = validCoords.reduce((sum, loc) => sum + (loc.lat || 0), 0) / validCoords.length;
               const centerLng = validCoords.reduce((sum, loc) => sum + (loc.lng || 0), 0) / validCoords.length;
               setMapCenter([centerLat, centerLng]);
               
               const newMarkers: any[] = [];
               plan.forEach(d => {
                   if (d.locations) {
                       d.locations.forEach((loc, idx) => {
                           newMarkers.push({
                               lat: loc.lat,
                               lng: loc.lng,
                               title: loc.name,
                               day: d.day,
                               step: idx + 1,
                               type: loc.type
                           });
                       });
                   }
               });
               setMarkers(newMarkers);
           } else {
               // Geocode fallback if AI failed to return any specific coordinates
               const geocoded = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}`)
                  .then(r => r.json());
               
               if (geocoded && geocoded.length > 0) {
                   const lat = parseFloat(geocoded[0].lat);
                   const lng = parseFloat(geocoded[0].lon);
                   setMapCenter([lat, lng]);
               }
           }
        } else {
           throw new Error("No plan returned");
        }
    } catch (e) {
        console.warn("API Error, couldn't fetch data", e);
        alert("Could not generate itinerary. Please try again.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="max-w-4xl mx-auto text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold mb-5 border border-indigo-100">
          <Calendar size={15} /> AI-Powered Itineraries
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-3">
          Plan Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Perfect Trip</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Get a curated day-by-day "Must See & Eat" plan with an interactive route map in seconds.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-10">
          <div className="p-8">
            <form onSubmit={generateItinerary} className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Destination</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
                      <input
                          type="text"
                          required
                          minLength={2}
                          maxLength={100}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all font-medium text-gray-900 placeholder-gray-400"
                          placeholder="e.g., Paris, Tokyo, New York"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Duration</label>
                      <span className="text-indigo-600 font-black text-lg">{days} {days === 1 ? 'Day' : 'Days'}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="7"
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                        {[1,2,3,4,5,6,7].map(d => (
                          <span key={d} className={d === days ? 'text-indigo-600 font-bold' : ''}>{d}d</span>
                        ))}
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-colors disabled:opacity-50 shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2"
                >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating Your Plan...
                      </>
                    ) : (
                      <><Calendar size={18} /> Create Itinerary</>
                    )}
                </button>
            </form>
          </div>
        </div>
      </div>

      {itinerary.length > 0 && (
          <div className="flex flex-col lg:flex-row gap-8">
              {/* Left side: Itinerary List */}
              <div className="w-full lg:w-1/3 xl:w-1/4 space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
                    {itinerary.map((day) => (
                        <div key={day.day} className="bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:border-indigo-100 transition-all shadow-sm">
                            <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <span className="font-extrabold text-indigo-900 text-lg">Day {day.day}</span>
                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider bg-white px-3 py-1 rounded-full shadow-sm">Itinerary</span>
                            </div>
                            <div className="p-6 grid gap-6">
                                <div className="space-y-5">
                                    <div className="flex gap-4">
                                        <div className="mt-0.5 bg-orange-50 p-2 rounded-xl h-fit shadow-sm"><Sun className="w-5 h-5 text-orange-500" /></div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Morning</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed">{day.morning}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="mt-0.5 bg-yellow-50 p-2 rounded-xl h-fit shadow-sm"><Sun className="w-5 h-5 text-yellow-500" /></div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Afternoon</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed">{day.afternoon}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="mt-0.5 bg-purple-50 p-2 rounded-xl h-fit shadow-sm"><Sunset className="w-5 h-5 text-purple-600" /></div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 mb-1">Evening</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed">{day.evening}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-100 rounded-bl-full -mr-8 -mt-8"></div>
                                    <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold relative z-10">
                                        <Coffee className="w-5 h-5" />
                                        Must Eat
                                    </div>
                                    <p className="text-gray-800 text-sm font-medium italic relative z-10 leading-relaxed">
                                        "{day.food}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right side: Map */}
                <div className="w-full lg:w-2/3 xl:w-3/4 h-[500px] lg:h-[800px] rounded-3xl overflow-hidden shadow-xl border border-gray-200 relative sticky top-6 z-0">
                     <MapContainer center={mapCenter} zoom={13} className="w-full h-full z-0" zoomControl={false}>
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />
                        <ChangeView center={mapCenter} zoom={13} />

                        {/* Draw Polylines for each day */}
                        {itinerary.map((dayPlan) => {
                            if (!dayPlan.locations || dayPlan.locations.length < 2) return null;
                            const pathCoords: [number, number][] = dayPlan.locations.map(loc => [loc.lat, loc.lng]);
                            const color = DAY_COLORS[(dayPlan.day - 1) % DAY_COLORS.length];
                            
                            // To simulate "arrows", we can use a dashed line or just rely on the step numbers.
                            return (
                                <Polyline 
                                    key={`path-day-${dayPlan.day}`} 
                                    positions={pathCoords} 
                                    pathOptions={{ 
                                        color: color, 
                                        weight: 4, 
                                        opacity: 0.8,
                                        dashArray: '10, 10' // Creates a dotted/dashed visual path line
                                    }} 
                                />
                            );
                        })}

                        {/* Draw Markers */}
                        {markers.map((marker: any, idx) => {
                            const markerColor = DAY_COLORS[(marker.day - 1) % DAY_COLORS.length];
                            
                            // Create custom colored HTML icon for sequence
                            const customIcon = L.divIcon({
                                className: 'custom-div-icon',
                                html: `<div style="background-color: ${markerColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-family: sans-serif; font-size: 14px;">${marker.step || 1}</div>`,
                                iconSize: [28, 28],
                                iconAnchor: [14, 14]
                            });

                            return (
                                <Marker key={idx} position={[marker.lat, marker.lng]} icon={customIcon}>
                                    <Popup className="rounded-2xl min-w-[200px]">
                                        <div className="font-bold text-gray-900 text-base">{marker.title}</div>
                                        <div className="text-sm text-gray-600 capitalize mt-0.5">{marker.type || 'Activity'}</div>
                                        <div className="mt-2 text-white px-2.5 py-1 rounded-md font-bold text-xs inline-block shadow-sm" style={{ backgroundColor: markerColor }}>
                                            Day {marker.day} • Stop {marker.step}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                    <div className="absolute bottom-6 right-6 z-[1000] bg-white p-4 rounded-2xl shadow-xl flex flex-col gap-2 max-w-[200px]">
                         <div className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-1 border-b border-gray-100 pb-2">Day Paths</div>
                         <div className="flex flex-col gap-2 pt-1 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                             {itinerary.map(day => (
                                 <div key={`legend-day-${day.day}`} className="flex items-center gap-2">
                                     <div className="w-4 h-4 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: DAY_COLORS[(day.day - 1) % DAY_COLORS.length] }}></div>
                                     <span className="text-xs font-bold text-gray-700">Day {day.day} Path</span>
                                 </div>
                             ))}
                         </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Planner;
