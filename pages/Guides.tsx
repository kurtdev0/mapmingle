import React, { useState, useEffect } from 'react';
import { GuideProfile } from '../types';
import { Star, MapPin, MessageCircle, Filter, CheckCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import ChatModal from '../components/ChatModal';
import { dbServices } from '../services/dbServices';

const Guides: React.FC = () => {
  const [guides, setGuides] = useState<GuideProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterExpertise, setFilterExpertise] = useState<string>('All');
  const [isBecomeGuideOpen, setIsBecomeGuideOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<GuideProfile | null>(null);

  const [applyName, setApplyName] = useState('');
  const [applyExpertise, setApplyExpertise] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const loadGuides = async () => {
      try {
          setLoading(true);
          const data = await dbServices.getGuides();
          setGuides(data);
      } catch (error) {
          console.error("Failed to load guides:", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
     loadGuides();
  }, []);

  const handleBecomeGuideSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsApplying(true);
      try {
          const expertiseList = applyExpertise.split(',').map(s => s.trim()).filter(Boolean);
          await dbServices.upgradeToGuide(expertiseList);
          alert("Congratulations! You are now a verified Guide. You can receive booking requests from travelers. You can now edit your expertise regions from your Profile Edit menu.");
          setIsBecomeGuideOpen(false);
          loadGuides();
      } catch (err: any) {
          console.error(err);
          alert(err.message || "Failed to apply for guide status");
      } finally {
          setIsApplying(false);
          setApplyName('');
          setApplyExpertise('');
          setApplyReason('');
      }
  };

  const toggleFollow = async (id: string, e: React.MouseEvent, currentlyFollowing: boolean) => {
    e.preventDefault();
    // Optimistic Update
    setGuides(prev => prev.map(g => 
      g.id === id ? { ...g, isFollowing: !currentlyFollowing } : g
    ));

    try {
        await dbServices.toggleFollow(id, currentlyFollowing);
    } catch (err) {
        console.error("Failed to toggle follow status:", err);
        // Revert Optimistic Update
        setGuides(prev => prev.map(g => 
          g.id === id ? { ...g, isFollowing: currentlyFollowing } : g
        ));
    }
  };

  const openChat = (e: React.MouseEvent, guide: GuideProfile) => {
      e.preventDefault();
      setSelectedGuide(guide);
      setIsChatOpen(true);
  };

  const filteredGuides = filterExpertise === 'All' 
    ? guides 
    : guides.filter(g => g.expertise.includes(filterExpertise));

  const uniqueExpertise = ['All', ...Array.from(new Set(guides.flatMap(g => g.expertise)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-6">
        <div>
           <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Local Guides</h1>
           <p className="text-gray-500">Connect with validated local experts for authentic experiences.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
                <select 
                    value={filterExpertise}
                    onChange={(e) => setFilterExpertise(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium shadow-sm"
                >
                    {uniqueExpertise.map(exp => (
                        <option key={exp} value={exp}>{exp}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <Filter size={16} />
                </div>
            </div>
            <button 
                onClick={() => setIsBecomeGuideOpen(true)}
                className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg transition-all whitespace-nowrap"
            >
                Become a Guide
            </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
          <div className="text-center py-20 text-gray-500">Loading Guides...</div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredGuides.map((guide) => (
              <Link to={`/guides/${guide.id}`} key={guide.id} className="group block bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                        <img 
                            src={guide.avatarUrl} 
                            alt={guide.name} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md group-hover:border-indigo-100 transition-colors"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-white w-4 h-4 rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors">{guide.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                        <MapPin size={12} /> {guide.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-bold text-gray-900">{guide.rating}</span>
                  </div>
                </div>

                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4 h-10">
                    {guide.bio}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                    {guide.expertise.slice(0, 3).map(exp => (
                        <span key={exp} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-md font-semibold tracking-wide uppercase border border-gray-100">
                            {exp}
                        </span>
                    ))}
                </div>

                <div className="flex gap-3 mt-auto">
                    <button 
                        onClick={(e) => toggleFollow(guide.id, e, guide.isFollowing)}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                            guide.isFollowing 
                            ? 'bg-gray-100 text-gray-800' 
                            : 'bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700'
                        }`}
                    >
                        {guide.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button 
                        onClick={(e) => openChat(e, guide)}
                        className="p-2.5 border border-gray-200 rounded-xl text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-colors bg-white"
                    >
                        <MessageCircle size={20} />
                    </button>
                </div>
              </Link>
            ))}
          </div>
      )}

      {/* Become a Guide Modal */}
      <Modal isOpen={isBecomeGuideOpen} onClose={() => setIsBecomeGuideOpen(false)} title="Become a Local Guide">
        <form className="space-y-4" onSubmit={handleBecomeGuideSubmit}>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                <input 
                    type="text" 
                    value={applyName}
                    onChange={(e) => setApplyName(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-gray-900 transition-all shadow-sm" 
                    placeholder="Your Name" 
                    required 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">City of Expertise</label>
                <input 
                    type="text" 
                    value={applyExpertise}
                    onChange={(e) => setApplyExpertise(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-gray-900 transition-all shadow-sm" 
                    placeholder="e.g. Paris, Lyon (comma separated)" 
                    required 
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Why should we verify you?</label>
                <textarea 
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 transition-all resize-none shadow-sm" 
                    rows={3} 
                    placeholder="Tell us about your local knowledge..." 
                    required
                ></textarea>
            </div>
            <button type="submit" disabled={isApplying} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-md disabled:opacity-50">
                {isApplying ? 'Submitting...' : 'Submit Application'}
            </button>
        </form>
      </Modal>

      {/* Chat Modal */}
      {selectedGuide && (
          <ChatModal 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            recipientName={selectedGuide.name}
            recipientAvatar={selectedGuide.avatarUrl}
            recipientId={selectedGuide.id}
          />
      )}
    </div>
  );
};

export default Guides;
