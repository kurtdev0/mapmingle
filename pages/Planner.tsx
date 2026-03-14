import React, { useState } from 'react';
import * as Gemini from '../services/geminiService';
import { ItineraryDay } from '../types';
import { Sun, Sunset, Moon, Coffee, Calendar } from 'lucide-react';

const Planner: React.FC = () => {
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([]);
  const [loading, setLoading] = useState(false);

  const generateItinerary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) return;
    setLoading(true);
    try {
        const plan = await Gemini.getItinerary(destination, days);
        if (plan && plan.length > 0) {
           setItinerary(plan);
        } else {
           throw new Error("No plan returned");
        }
    } catch (e) {
        console.warn("API Error, providing mock itinerary", e);
        // Mock data fallback
        const mockPlan: ItineraryDay[] = Array.from({ length: days }).map((_, i) => ({
            day: i + 1,
            morning: `Explore the hidden alleys of ${destination} and visit a local cafe.`,
            afternoon: `Visit the central museum and take a walk in the main park.`,
            evening: `Enjoy sunset views from a prominent vantage point.`,
            food: `Try the famous local street food near the night market.`
        }));
        setItinerary(mockPlan);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10">
          <div className="bg-indigo-600 px-8 py-8 text-center">
            <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-3">
                <Calendar className="w-8 h-8" />
                Trip Planner
            </h1>
            <p className="text-indigo-100 mt-2">Get a curated "Must See & Eat" plan in seconds.</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={generateItinerary} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                    <input 
                        type="text" 
                        required
                        className="w-full border-gray-300 border rounded-lg px-4 py-3 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Paris, Tokyo, New York"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration: {days} Days</label>
                    <input 
                        type="range" 
                        min="1" 
                        max="7" 
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                        <span>1 Day</span>
                        <span>7 Days</span>
                    </div>
                </div>
                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Generating Plan...' : 'Create Itinerary'}
                </button>
            </form>
          </div>
        </div>

        {itinerary.length > 0 && (
            <div className="space-y-8">
                {itinerary.map((day) => (
                    <div key={day.day} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-wide text-sm">
                            Day {day.day}
                        </div>
                        <div className="p-6 grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="mt-1"><Sun className="w-5 h-5 text-orange-400" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Morning</h4>
                                        <p className="text-gray-600 text-sm">{day.morning}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-1"><Sun className="w-5 h-5 text-yellow-500" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Afternoon</h4>
                                        <p className="text-gray-600 text-sm">{day.afternoon}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="mt-1"><Sunset className="w-5 h-5 text-purple-500" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">Evening</h4>
                                        <p className="text-gray-600 text-sm">{day.evening}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-indigo-50 rounded-xl p-5 flex flex-col justify-center">
                                <div className="flex items-center gap-2 mb-2 text-indigo-700 font-bold">
                                    <Coffee className="w-5 h-5" />
                                    Must Eat
                                </div>
                                <p className="text-indigo-900 text-sm font-medium italic">
                                    "{day.food}"
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Planner;
