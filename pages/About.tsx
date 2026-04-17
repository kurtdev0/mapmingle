import React from 'react';
import { Compass, Map, Users, Sparkles, Target } from 'lucide-react';

const About: React.FC = () => {
  const features = [
    {
      icon: Compass,
      title: 'Hidden Gems',
      desc: 'AI-powered search that surfaces authentic local spots guidebooks never mention.',
    },
    {
      icon: Map,
      title: 'Interactive Maps',
      desc: 'Visual itineraries and real-time essentials mapped to wherever you are.',
    },
    {
      icon: Users,
      title: 'Local Guides',
      desc: 'Connect with verified locals who know their city inside out.',
    },
    {
      icon: Target,
      title: 'Truth Scale',
      desc: 'AI-rated hype checker — find out if a famous spot is actually worth the visit.',
    },
    {
      icon: Sparkles,
      title: 'Trip Planner',
      desc: 'Generate a full day-by-day itinerary with a single click.',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-14">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-sm shadow-indigo-600/20">
            <Compass size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">MapMingle</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
          Built for travelers<br className="hidden sm:block" /> who hate tourist traps.
        </h1>
        <p className="text-gray-500 text-lg leading-relaxed max-w-xl">
          MapMingle is a community-driven travel platform that uses AI to help you find hidden gems,
          plan smarter trips, and connect with people who actually know the places you're visiting.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm mb-3 border border-gray-100">
              <Icon size={17} className="text-indigo-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div className="border-t border-gray-100 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Our mission</h2>
        <p className="text-gray-500 leading-relaxed mb-4">
          Too many travel experiences are shaped by the same list of overcrowded landmarks.
          MapMingle exists to change that — by combining the knowledge of locals with the power
          of AI to surface places that are genuinely worth your time.
        </p>
        <p className="text-gray-500 leading-relaxed">
          Whether you're a traveler looking for your next adventure or a local who wants to share
          what makes your city special, MapMingle gives you the tools to do both.
        </p>
      </div>
    </div>
  );
};

export default About;
