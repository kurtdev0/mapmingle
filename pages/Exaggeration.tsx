import React, { useState } from 'react';
import * as Gemini from '../services/geminiService';
import { ExaggerationResult } from '../types';
import { AlertCircle, ThumbsUp, ThumbsDown, Scale } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

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
            verdict: "It's a mix of stunning views and large crowds.",
            reasoning: "While the historical significance is undeniable, the sheer volume of tourists can detract from the experience. Go early in the morning."
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">The Truth Scale</h1>
        <p className="text-lg text-gray-500">Is it worth the hype? Find out if a location is a tourist trap or a hidden gem.</p>
      </div>

      <div className="max-w-xl mx-auto">
        <form onSubmit={handleCheck} className="relative mb-12">
            <input 
                type="text" 
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="Enter a famous location (e.g. Times Square)"
                className="w-full text-lg px-6 py-4 rounded-full border-2 border-gray-300 focus:border-indigo-500 focus:ring-0 shadow-sm"
            />
            <button 
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-gray-900 text-white px-8 rounded-full font-bold hover:bg-gray-800 disabled:opacity-70"
            >
                {loading ? 'Judging...' : 'Judge It'}
            </button>
        </form>

        {result && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-8 text-center border-b border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{result.placeName}</h2>
                    <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">Exaggeration Level</p>
                
                    <div className="h-64 w-full mt-4 relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[{ value: result.score }, { value: 10 - result.score }]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    startAngle={180}
                                    endAngle={0}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill={getColor(result.score)} />
                                    <Cell fill="#f3f4f6" />
                                    <Label 
                                        value={`${result.score}/10`} 
                                        position="center" 
                                        className="text-4xl font-bold fill-gray-900"
                                        style={{ fontSize: '2rem', fontWeight: 'bold' }}
                                    />
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute bottom-10 left-0 right-0 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase`} style={{ backgroundColor: getColor(result.score) }}>
                                {result.score > 7 ? 'Tourist Trap' : result.score < 4 ? 'Hidden Gem' : 'Fairly Rated'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600">
                            <Scale size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">The Verdict</h3>
                            <p className="text-gray-700 italic">"{result.verdict}"</p>
                        </div>
                    </div>
                    
                    <div className="bg-white p-5 rounded-xl border border-gray-200">
                         <h4 className="font-bold text-xs text-gray-400 uppercase mb-2">Why?</h4>
                         <p className="text-gray-600 text-sm leading-relaxed">
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
