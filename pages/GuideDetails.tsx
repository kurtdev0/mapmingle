import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { GuideProfile } from '../types';
import { Star, MapPin, ArrowLeft, MessageCircle, UserPlus, Grid, Award, Shield, UserCheck } from 'lucide-react';
import ChatModal from '../components/ChatModal';
import Modal from '../components/Modal';
import { dbServices } from '../services/dbServices';

const GuideDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [guide, setGuide] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'book' | 'gem' | null>(null);

  const [bookingDate, setBookingDate] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [isBooking, setIsBooking] = useState(false);
  const [tourPackages, setTourPackages] = useState<any[]>([]);
  const [guidePosts, setGuidePosts] = useState<any[]>([]);

  useEffect(() => {
     const loadGuide = async () => {
         if (!id) return;
         setLoading(true);
         try {
             // We can reuse getGuides and find the specific one 
             // for simplicity since we don't have a getGuideById yet
             const guides = await dbServices.getGuides();
             const found = guides.find(g => g.id === id) || null;
             setGuide(found);
             
             if (found) {
                 const pkgs = await dbServices.getTourPackages(found.id).catch(() => []);
                 setTourPackages(pkgs);

                 // Fetch this guide's actual posts
                 const allPosts = await dbServices.getFeedPosts();
                 const myPosts = allPosts.filter(p => p.author.id === found.id);
                 setGuidePosts(myPosts);
             }
         } catch (err) {
             console.error("Failed to load guide details:", err);
         } finally {
             setLoading(false);
         }
     };
     loadGuide();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Guide...</div>;
  if (!guide) return <div className="p-8 text-center text-gray-500">Guide not found</div>;

  const toggleFollow = async () => {
    if (!guide) return;
    const currentlyFollowing = guide.isFollowing;
    
    // Optimistic update
    setGuide({ ...guide, isFollowing: !currentlyFollowing });

    try {
        await dbServices.toggleFollow(guide.id, currentlyFollowing);
    } catch (err) {
        console.error("Failed to toggle follow status:", err);
        // Revert 
        setGuide({ ...guide, isFollowing: currentlyFollowing });
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!guide || !bookingDate) return;
      
      setIsBooking(true);
      try {
          if (selectedPackageId) {
              await dbServices.bookTourPackage(selectedPackageId, guide.id, bookingDate, bookingNotes);
          } else {
              await dbServices.bookAppointment(guide.id, bookingDate, bookingNotes);
          }
          setActiveModal(null);
          setBookingDate('');
          setBookingNotes('');
          setSelectedPackageId('');
          alert(`Booking request sent! ${guide.name} will contact you shortly.`);
      } catch (err) {
          console.error("Failed to book", err);
          alert("Failed to book. Are you logged in?");
      } finally {
          setIsBooking(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/guides" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors">
        <ArrowLeft size={18} className="mr-2" /> Back to Guides
      </Link>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
        <div className="h-48 bg-gradient-to-r from-gray-900 to-indigo-900 relative">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>
        <div className="px-8 pb-8">
            <div className="relative -mt-16 mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
                 <div className="relative">
                    <img 
                        src={guide.avatarUrl} 
                        alt={guide.name} 
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white"
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                 </div>
                <div className="flex gap-3 mb-2 w-full md:w-auto">
                    <button 
                        onClick={toggleFollow}
                        className={`flex-1 md:flex-none px-6 py-2.5 rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                            guide.isFollowing 
                            ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' 
                            : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700'
                        }`}
                    >
                        {guide.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                        {guide.isFollowing ? 'Following' : 'Follow'}
                    </button>
                    <button 
                        onClick={() => setIsChatOpen(true)}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-bold hover:border-gray-900 hover:text-gray-900 transition-all flex items-center justify-center gap-2"
                    >
                        <MessageCircle size={18} /> Message
                    </button>
                     <button 
                        onClick={() => setActiveModal('book')}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-green-600 text-white rounded-full font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                    >
                        <Award size={18} /> Book Tour
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-3xl font-serif font-bold text-gray-900">{guide.name}</h1>
                    <Shield className="text-indigo-600 fill-indigo-50" size={24} />
                    {guide.isVerified && (
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-blue-100 shadow-sm ml-2">
                            <Shield size={14} className="fill-current" /> Verified Guide
                        </span>
                    )}
                </div>
                <p className="text-gray-500 font-medium mb-4 flex items-center gap-2">
                    <span className="text-indigo-600 font-bold">{guide.username}</span> 
                    • 
                    <MapPin size={14} /> {guide.location}
                </p>
                
                <div className="flex gap-8 mb-8 text-sm border-y border-gray-100 py-4">
                    <div className="flex flex-col">
                        <span className="font-bold text-xl text-gray-900">{guide.followers}</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Followers</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl text-gray-900">{guide.reviews}</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Reviews</span>
                    </div>
                    <div className="flex flex-col">
                         <div className="flex items-center gap-1">
                             <span className="font-bold text-xl text-gray-900">{guide.rating}</span>
                             <Star size={18} className="text-yellow-400 fill-current" />
                         </div>
                        <span className="text-gray-500 text-xs uppercase tracking-wider font-medium">Rating</span>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-2">About</h3>
                    <p className="text-gray-600 leading-relaxed max-w-2xl">{guide.bio}</p>
                </div>

                <div>
                    <h3 className="font-bold text-gray-900 mb-2">Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                        {guide.expertise.map(exp => (
                            <span key={exp} className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-full text-sm font-medium">
                                {exp}
                            </span>
                        ))}
                    </div>
                </div>

                {tourPackages.length > 0 && (
                    <div className="mt-8 border-t border-gray-100 pt-6">
                        <h3 className="font-bold text-gray-900 mb-4">Available Tour Packages</h3>
                        <div className="space-y-4">
                            {tourPackages.map(pkg => (
                                <div key={pkg.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-lg mb-1">{pkg.title}</h4>
                                        <p className="text-gray-600 mb-3 text-sm leading-relaxed">{pkg.description}</p>
                                        <div className="flex gap-3 text-xs font-bold text-gray-500">
                                            <span className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">{pkg.duration_hours} Hrs</span>
                                            <span className="bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">Max {pkg.max_people} Ppl</span>
                                        </div>
                                    </div>
                                    <div className="md:text-right flex flex-col justify-between shrink-0 mt-4 md:mt-0 items-start md:items-end">
                                        <span className="text-2xl font-black text-indigo-600 mb-2">${pkg.price}</span>
                                        <button 
                                            onClick={() => {
                                                setSelectedPackageId(pkg.id);
                                                setActiveModal('book');
                                            }}
                                            className="bg-gray-900 text-white px-5 py-2 text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 w-full md:w-auto"
                                        >
                                            Select Package
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 pb-2">
           <Grid className="text-gray-900" size={20} />
           <h2 className="text-lg font-bold text-gray-900">Guide's Hidden Gems</h2>
      </div>
      
      {guidePosts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {guidePosts.map((post) => (
                    <div key={post.id} onClick={() => setActiveModal('gem')} className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative group cursor-pointer border border-gray-100">
                        <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={post.location} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold drop-shadow-md">{post.location}</span>
                        </div>
                    </div>
                ))}
          </div>
      ) : (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-500 font-medium">This guide hasn't shared any hidden gems yet.</p>
          </div>
      )}

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        recipientName={guide.name}
        recipientAvatar={guide.avatarUrl}
        recipientId={guide.id}
      />

      <Modal isOpen={activeModal === 'book'} onClose={() => setActiveModal(null)} title={`Book a tour with ${guide.name}`}>
          <form className="space-y-4" onSubmit={handleBooking}>
              {tourPackages.length > 0 && (
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Package (Optional)</label>
                      <select 
                          value={selectedPackageId} 
                          onChange={(e) => setSelectedPackageId(e.target.value)}
                          className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-indigo-500 font-medium bg-gray-50"
                      >
                          <option value="">Custom Tour / None</option>
                          {tourPackages.map(pkg => (
                              <option key={pkg.id} value={pkg.id}>{pkg.title} (${pkg.price})</option>
                          ))}
                      </select>
                  </div>
              )}
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                  <input 
                      type="date" 
                      value={bookingDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-indigo-500 font-medium bg-gray-50" 
                      required 
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of People</label>
                  <input type="number" min="1" max="10" defaultValue="1" className="w-full border-gray-300 rounded-lg p-2.5 border focus:ring-2 focus:ring-indigo-500 font-medium bg-gray-50" required />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea 
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      className="w-full border-gray-300 rounded-lg p-3 border focus:ring-2 focus:ring-indigo-500 bg-gray-50" 
                      rows={3} 
                      placeholder="Tell the guide what you're interested in..."
                      required={!selectedPackageId}
                  ></textarea>
              </div>
              <button 
                  type="submit" 
                  disabled={isBooking || !bookingDate}
                  className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 shadow-md disabled:opacity-50"
              >
                  {isBooking ? 'Requesting...' : 'Request Booking'}
              </button>
          </form>
      </Modal>

      <Modal isOpen={activeModal === 'gem'} onClose={() => setActiveModal(null)} title="Hidden Gem Details">
          <div className="text-center p-4">
              <span className="text-4xl block mb-4">🤫</span>
              <h3 className="text-xl font-bold text-gray-900 mb-2">It's a secret!</h3>
              <p className="text-gray-600 mb-6">You must book a tour with {guide.name} or follow them to unlock the exact location of this hidden gem.</p>
              <button onClick={() => setActiveModal('book')} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-indigo-700">Book Tour to Unlock</button>
          </div>
      </Modal>
    </div>
  );
};

export default GuideDetails;
