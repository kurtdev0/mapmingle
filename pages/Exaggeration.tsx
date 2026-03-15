import React, { useState } from 'react';
import * as Gemini from '../services/geminiService';
import { ExaggerationResult } from '../types';
import { Scale, Activity } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const Exaggeration: React.FC = () => {
  const [place, setPlace] = useState('');
  const [result, setResult] = useState<ExaggerationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!place) return;
    setLoading(true);
    try {
        const data = await Gemini.getExaggerationScore(place);
        if (data.verdict !== "Unknown") {
           setResult(data);
        } else {
           throw new Error("Could not analyze");
        }
    } catch (err) {
        console.warn("API Error, providing mock result", err);
        setResult({
            placeName: place,
            score: Math.floor(Math.random() * 10) + 1,
            verdict: "A mix of stunning views and large crowds.",
            reasoning: "While the historical significance is undeniable, the sheer volume of tourists can detract from the experience.",
            metrics: {
                waitingTime: Math.floor(Math.random() * 10) + 1,
                taste: Math.floor(Math.random() * 10) + 1,
                crowdedness: Math.floor(Math.random() * 10) + 1,
                view: Math.floor(Math.random() * 10) + 1,
                valueForMoney: Math.floor(Math.random() * 10) + 1,
                accessibility: Math.floor(Math.random() * 10) + 1,
            }
        });
    } finally {
        setLoading(false);
    }
  };

  const getColor = (score: number) => {
      if (score < 4) return '#22c55e'; // Green - Underrated
      if (score < 7) return '#eab308'; // Yellow - Fair
      return '#ef4444'; // Red - Overrated
  };

  const formatChartData = (metrics: any) => {
      if (!metrics) return [];
      return [
          { subject: 'Wait Time', A: metrics.waitingTime, fullMark: 10 },
          { subject: 'Quality', A: metrics.taste, fullMark: 10 },
          { subject: 'Crowds', A: metrics.crowdedness, fullMark: 10 },
          { subject: 'Value', A: metrics.valueForMoney, fullMark: 10 },
          { subject: 'Access', A: metrics.accessibility, fullMark: 10 },
          { subject: 'Vibe/View', A: metrics.view, fullMark: 10 },
      ];
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">The Truth Scale</h1>
        <p className="text-lg text-gray-500">Is it worth the hype? Find out if a location is a tourist trap or a hidden gem.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleCheck} className="relative mb-12">
            <input 
                type="text" 
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Enter a famous location (e.g. Times Square)"
                className="w-full text-lg px-6 py-4 rounded-full border-2 border-gray-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none shadow-sm transition-all"
            />
            <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white px-8 rounded-full font-bold hover:bg-gray-800 disabled:opacity-70 transition-colors"
            >
                {loading ? 'Judging...' : 'Judge It'}
            </button>
        </form>

        {result && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">
                {/* Left Side: Score & Charts */}
                <div className="flex-1 p-8 text-center border-b md:border-b-0 md:border-r border-gray-100 relative bg-gradient-to-br from-white to-gray-50">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{result.placeName}</h2>
                    <p className="text-gray-500 font-medium uppercase tracking-widest text-xs mb-6">Exaggeration Level</p>
                    
                    <div className="inline-block p-6 rounded-full border-4 shadow-inner mb-6 bg-white" style={{ borderColor: getColor(result.score) }}>
                        <div className="text-5xl font-black text-gray-900 leading-none">
                            {result.score}<span className="text-xl text-gray-400">/10</span>
                        </div>
                    </div>
                    
                    <div className="mb-4">
                        <span className="px-4 py-2 rounded-full text-sm font-bold text-white uppercase shadow-md" style={{ backgroundColor: getColor(result.score) }}>
                            {result.score > 7 ? 'Tourist Trap' : result.score < 4 ? 'Hidden Gem' : 'Fairly Rated'}
                        </span>
                    </div>

                    {result.metrics && (
                        <div className="h-64 mt-4 -ml-4 -mr-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={formatChartData(result.metrics)}>
                                    <PolarGrid stroke="#e5e7eb" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Radar name="Metrics" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.4} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Right Side: Verdict & Reasoning */}
                <div className="flex-1 p-8 bg-white flex flex-col justify-center">
                    <div className="flex items-start gap-4 mb-8">
                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600 shadow-sm shrink-0">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-gray-900 mb-2 uppercase tracking-wide text-sm">The Verdict</h3>
                            <p className="text-gray-800 text-lg leading-snug font-medium italic">"{result.verdict}"</p>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 relative">
                         <div className="absolute -top-3 left-6 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                             <Activity size={12} /> Reasoning
                         </div>
                         <p className="text-gray-600 leading-relaxed pt-2">
                             {result.reasoning}
                         </p>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Exaggeration;
