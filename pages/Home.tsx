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
      if (results && results.length > 0) {
          // Add manual tags for UI if missing
          const enriched = results.map(p => ({
              ...p, 
              tags: p.tags || ['Hidden Gem', 'Local Spot']
          }));
          setPlaces(enriched);
      } else {
          throw new Error("No results returned");
      }
    } catch (error) {
      console.error("API Error during search, using mock data", error);
      setPlaces([
          {
              name: `Secret Alley of ${city}`,
              address: `${city} Old Town`,
              rating: 4.8,
              tags: ['Hidden Gem', 'Photography'],
              photoUrl: `https://loremflickr.com/800/600/travel,${encodeURIComponent(city)}?random=1`
          },
          {
              name: `Local's Favorite Cafe`,
              address: `${city} City Center hidden street`,
              rating: 4.9,
              tags: ['Food', 'Local Spot'],
              photoUrl: `https://loremflickr.com/800/600/cafe,${encodeURIComponent(city)}?random=2`
          },
          {
              name: `Viewpoint of ${city}`,
              address: `Hills of ${city}`,
              rating: 4.7,
              tags: ['View', 'Nature'],
              photoUrl: `https://loremflickr.com/800/600/nature,${encodeURIComponent(city)}?random=3`
          }
      ]);
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
                    photoUrl: '/sintra.png'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };
    loadInitial();
  }, []);

  const heroCards = [
    {
      name: 'Oeschinen Lake',
      location: 'Kandersteg, Switzerland',
      tag: 'Nature',
      rating: 4.9,
      photo: 'https://images.unsplash.com/photo-1549880181-56a44cf4a9a5?auto=format&fit=crop&q=80&w=600',
    },
    {
      name: 'Jiufen Old Street',
      location: 'Ruifang District, Taiwan',
      tag: 'Culture',
      rating: 4.7,
      photo: 'https://images.unsplash.com/photo-1493780474015-ba834fd0ce2f?auto=format&fit=crop&q=80&w=600',
    },
    {
      name: 'Sintra Palaces',
      location: 'Sintra, Portugal',
      tag: 'Architecture',
      rating: 4.8,
      photo: '/sintra.png',
    },
  ];

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Column */}
            <div>
     
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                Discover the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                  Undiscovered
                </span>
              </h1>
              <p className="text-xl text-gray-500 mb-10 leading-relaxed font-light max-w-lg">
                Escape the tourist traps. Find hidden gems, secret spots, and local favorites that guidebooks miss.
              </p>

              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <MapPin className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-14 pr-16 py-5 border border-gray-200 rounded-3xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 text-lg shadow-xl shadow-indigo-100/30 transition-all"
                  placeholder="Where is your next adventure? (e.g. Kyoto)"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  minLength={2}
                  maxLength={100}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute inset-y-2 right-2 px-6 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? '...' : <Search size={22} />}
                </button>
              </form>

              <div className="flex items-center gap-8 mt-10">
                <div>
                  <div className="text-2xl font-bold text-gray-900">10,000+</div>
                  <div className="text-sm text-gray-500">Hidden gems</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">150+</div>
                  <div className="text-sm text-gray-500">Countries</div>
                </div>
                <div className="w-px h-10 bg-gray-200" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">4.9★</div>
                  <div className="text-sm text-gray-500">Avg. rating</div>
                </div>
              </div>
            </div>

            {/* Right Column — scattered card stack */}
            <div className="hidden lg:block relative h-[480px]">
              {/* Card 1 — top-left, tilted left */}
              <div className="absolute top-4 left-6 w-52 rounded-2xl overflow-hidden shadow-2xl rotate-[-4deg] z-10 bg-white border border-gray-100">
                <img src={heroCards[0].photo} alt={heroCards[0].name} className="w-full h-36 object-cover" />
                <div className="p-3">
                  <div className="font-bold text-sm text-gray-900 truncate">{heroCards[0].name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={11} className="text-indigo-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{heroCards[0].location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-semibold">{heroCards[0].tag}</span>
                    <span className="text-xs font-bold text-gray-800">★ {heroCards[0].rating}</span>
                  </div>
                </div>
              </div>

              {/* Card 2 — top-right, tilted right */}
              <div className="absolute top-0 right-2 w-52 rounded-2xl overflow-hidden shadow-xl rotate-[3deg] z-20 bg-white border border-gray-100">
                <img src={heroCards[1].photo} alt={heroCards[1].name} className="w-full h-36 object-cover" />
                <div className="p-3">
                  <div className="font-bold text-sm text-gray-900 truncate">{heroCards[1].name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={11} className="text-indigo-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{heroCards[1].location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-semibold">{heroCards[1].tag}</span>
                    <span className="text-xs font-bold text-gray-800">★ {heroCards[1].rating}</span>
                  </div>
                </div>
              </div>

              {/* Card 3 — bottom-center, nearly straight, front */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-60 rounded-2xl overflow-hidden shadow-2xl rotate-[-1deg] z-30 bg-white border border-gray-100">
                <img src={heroCards[2].photo} alt={heroCards[2].name} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <div className="font-bold text-sm text-gray-900 truncate">{heroCards[2].name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={11} className="text-indigo-500 flex-shrink-0" />
                    <span className="text-xs text-gray-500 truncate">{heroCards[2].location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-semibold">{heroCards[2].tag}</span>
                    <span className="text-xs font-bold text-gray-800">★ {heroCards[2].rating}</span>
                  </div>
                </div>
              </div>

              {/* Decorative background ring */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 rounded-full border border-indigo-100/60 bg-indigo-50/30" />
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
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
