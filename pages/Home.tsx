import React, { useEffect, useState } from 'react';
import { Search, MapPin, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Place } from '../types';
import * as Gemini from '../services/geminiService';
import PlaceCard from '../components/PlaceCard';

const Home: React.FC = () => {
  const [city, setCity] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setPlaces([]); // Clear previous
    try {
      const results = await Gemini.searchPlaces(`Hidden gems and unpopular but great locations in ${city}`);
      // Add manual tags for UI if missing
      const enriched = results.map(p => ({
          ...p, 
          tags: p.tags || ['Hidden Gem', 'Local Spot']
      }));
      setPlaces(enriched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInitial = async () => {
        setLoading(true);

        try {
            // More specific query to ensure photos are good
            const results = await Gemini.searchPlaces('Spectacular hidden travel destinations nature architecture');
            if (results && results.length > 0) {
                const enriched = results.map(p => ({...p, tags: ['Trending', 'Discovery']}));
                setPlaces(enriched);
            } else {
                 throw new Error("No results returned");
            }
        } catch (error) {
            console.warn("API Error, falling back to mock data", error);
             // Fallback to mock data if API fails or no results
            setPlaces([
                {
                    name: 'Oeschinen Lake',
                    address: 'Kandersteg, Switzerland',
                    rating: 4.9,
                    tags: ['Nature', 'Alpine', 'Trending'],
                    photoUrl: 'https://images.unsplash.com/photo-1549880181-56a44cf4a9a5?auto=format&fit=crop&q=80&w=800'
                },
                 {
                    name: 'Jiufen Old Street',
                    address: 'Ruifang District, Taiwan',
                    rating: 4.7,
                    tags: ['Culture', 'Food', 'Discovery'],
                    photoUrl: 'https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?auto=format&fit=crop&q=80&w=800'
                },
                {
                    name: 'Sintra Palaces',
                    address: 'Sintra, Portugal',
                    rating: 4.8,
                    tags: ['Architecture', 'History'],
                    photoUrl: 'https://images.unsplash.com/photo-1590059530432-849db9654d09?auto=format&fit=crop&q=80&w=800'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };
    loadInitial();
  }, []);

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-bold mb-8 animate-fade-in-up border border-indigo-100">
                <Sparkles size={16} /> #1 Community for authentic travel
            </div>
            <h1 className="text-5xl lg:text-7xl font-serif font-bold text-gray-900 tracking-tight mb-6 leading-tight">
            Discover the <br className="hidden md:block"/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Undiscovered</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
            Escape the tourist traps. Find the hidden gems, secret spots, and local favorites that guidebooks miss.
            </p>

            <div className="max-w-2xl mx-auto relative z-10">
                <form onSubmit={handleSearch} className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <MapPin className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-14 pr-16 py-5 border border-gray-200 rounded-3xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 text-lg shadow-xl shadow-gray-200/50 transition-all"
                        placeholder="Where is your next adventure? (e.g. Kyoto)"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="absolute inset-y-2 right-2 px-6 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black disabled:opacity-50 transition-all shadow-lg"
                    >
                        {loading ? '...' : <Search size={22} />}
                    </button>
                </form>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif font-bold text-gray-900">
                {hasSearched ? `Results for "${city}"` : 'Trending Hidden Gems'}
            </h2>
            {!hasSearched && <Link to="/feed" className="text-indigo-600 font-bold hover:underline">View All</Link>}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm flex flex-col gap-4">
                  <div className="h-48 bg-gray-50 rounded-xl animate-pulse"></div>
                  <div className="h-6 bg-gray-50 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-50 rounded w-1/2 animate-pulse"></div>
                  <div className="h-10 bg-gray-50 rounded-lg mt-auto animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {places.map((place, idx) => (
              <PlaceCard key={idx} place={place} />
            ))}
            {places.length === 0 && !loading && (
                <div className="col-span-full text-center py-20 bg-gray-50 rounded-3xl border border-gray-100 border-dashed">
                    <div className="inline-block p-4 rounded-full bg-white mb-4 shadow-sm">
                        <MapPin size={32} className="text-gray-400" />
                    </div>
                    <p className="text-xl font-bold text-gray-900">No hidden gems found.</p>
                    <p className="text-gray-500 mt-2">Try searching for a specific city or region.</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
