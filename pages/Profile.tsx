import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dbServices } from '../services/dbServices';
import { Settings, MapPin, Grid, Bookmark, Users, Star, Camera, X, Heart, MessageCircle, Shield } from 'lucide-react';
import PlaceCard from '../components/PlaceCard';
import Modal from '../components/Modal';

const Profile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [bookingRequests, setBookingRequests] = useState<any[]>([]);
  const [tourPackages, setTourPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'posts' | 'requests' | 'packages'>('saved');

  // Package creation state
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({ title: '', description: '', price: 0, durationHours: 2, maxPeople: 10 });

  // Edit Profile State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editExpertise, setEditExpertise] = useState('');
  const [editAvatarFile, setEditAvatarFile] = useState<File | null>(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
     loadData();
  }, [id]);

  const loadData = async () => {
      try {
          setLoading(true);
          const currentSessionProfile = await dbServices.getCurrentProfile();
          
          let targetProfile = currentSessionProfile;
          let isMe = true;

          // If an ID is provided and it's not the current user, fetch that specific user
          if (id && (!currentSessionProfile || id !== currentSessionProfile.id)) {
              isMe = false;
              targetProfile = await dbServices.getProfileById(id);
          }

          setProfile(targetProfile);
          setIsCurrentUser(isMe);

          // Populate edit modal state
          if (isMe && targetProfile) {
              setEditName(targetProfile.name || '');
              setEditUsername(targetProfile.username || '');
              setEditBio(targetProfile.bio || '');
              setEditExpertise(targetProfile.expertise ? targetProfile.expertise.join(', ') : '');
          }

          // Fetch their posts
          if (targetProfile) {
              const posts = await dbServices.getUserPosts(targetProfile.id);
              setUserPosts(posts);
          }

          // Fetch guide booking requests
          if (isMe && targetProfile?.is_guide) {
              const [requests, packages] = await Promise.all([
                 dbServices.getTourRequests().catch(() => []),
                 dbServices.getTourPackages(targetProfile.id).catch(() => [])
              ]);
              setBookingRequests(requests);
              setTourPackages(packages);
          } else if (targetProfile?.is_guide) {
              const packages = await dbServices.getTourPackages(targetProfile.id).catch(() => []);
              setTourPackages(packages);
          }

          // Fetch their saved places
          if (targetProfile && isMe) { // only load saved places if it's me
              const places = await dbServices.getSavedPlaces();
              setSavedPlaces(places);
          } else {
              setSavedPlaces([]); // We don't expose other users' saved places yet for privacy, or can we? 
              // The user prompt didn't specify, let's just make it empty for other people for now.
          }
      } catch (err) {
          console.error("Failed to load profile data:", err);
      } finally {
          setLoading(false);
      }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          const payload: any = {
              name: editName,
              username: editUsername,
              bio: editBio,
              avatarFile: editAvatarFile || undefined
          };
          
          if (profile.is_guide) {
              payload.expertise = editExpertise.split(',').map(s => s.trim()).filter(Boolean);
          }
          
          const updatedProfile = await dbServices.updateProfile(payload);
          
          setProfile(updatedProfile);
          setIsEditModalOpen(false);
      } catch (err) {
          console.error("Failed to update profile", err);
          alert("Failed to update profile.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setEditAvatarFile(file);
          const reader = new FileReader();
          reader.onloadend = () => setEditAvatarPreview(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          await dbServices.createTourPackage(newPackage.title, newPackage.description, Number(newPackage.price), Number(newPackage.durationHours), Number(newPackage.maxPeople));
          const packages = await dbServices.getTourPackages(profile.id);
          setTourPackages(packages);
          setIsPackageModalOpen(false);
          setNewPackage({ title: '', description: '', price: 0, durationHours: 2, maxPeople: 10 });
      } catch (err) {
          console.error("Failed to create package", err);
      } finally {
          setIsSaving(false);
      }
  };



  const handleRequestVerification = async () => {
      if (!isCurrentUser) return;
      try {
          // Mock verification request, just update local state to show it's pending/verified
          // In a real app this would submit a request to admin dashboard
          alert("Verification request submitted! We will review your profile shortly.");
          // Optimistically update
          setProfile(prev => prev ? { ...prev, isVerified: true } : prev);
      } catch (err) {
          console.error("Failed to request verification", err);
      }
  };

  if (loading) {
      return <div className="text-center py-20 text-gray-500">Loading Profile...</div>;
  }

  if (!profile) {
      return (
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
              <div className="bg-indigo-50 text-indigo-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={32} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Not Logged In</h2>
              <p className="text-gray-500">Please log in to view your profile and saved places.</p>
          </div>
      );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      
      {/* Profile Header */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
          
          <div className="relative pt-16 flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="relative">
                  <img 
                      src={profile.avatar_url} 
                      alt={profile.name} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-gray-100"
                  />
                  {profile.is_guide && (
                      <div className="absolute -bottom-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1 uppercase tracking-wider">
                          <Star size={10} className="fill-current" /> Guide
                      </div>
                  )}
              </div>

              <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <h1 className="text-3xl font-serif font-bold text-gray-900">{profile.name}</h1>
                          {profile.is_guide && <Shield className="text-indigo-600 fill-indigo-50" size={24} />}
                          {profile.isVerified && (
                              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-blue-100 shadow-sm">
                                  <Shield size={14} className="fill-current" /> Verified
                              </span>
                          )}
                      </div>
                      {isCurrentUser ? (
                          <div className="flex gap-2">
                              {profile.is_guide && !profile.isVerified && (
                                  <button onClick={handleRequestVerification} className="px-4 py-2 border border-blue-200 text-blue-600 bg-blue-50 rounded-xl font-bold flex gap-2 items-center hover:bg-blue-100 transition shadow-sm text-sm">
                                      <Shield size={16} /> Request Verification
                                  </button>
                              )}
                              <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 border border-gray-200 rounded-xl font-bold flex gap-2 items-center hover:bg-gray-50 transition shadow-sm text-sm">
                                  <Settings size={18} /> Edit Profile
                              </button>
                          </div>
                      ) : null}
                  </div>

                  {profile.bio && (
                      <p className="text-gray-700 mb-6 max-w-2xl leading-relaxed">{profile.bio}</p>
                  )}

                  {profile.is_guide && profile.expertise && profile.expertise.length > 0 && (
                      <div className="mb-6 flex flex-wrap gap-2">
                          {profile.expertise.map((area: string, i: number) => (
                              <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                  <MapPin size={10} /> {area}
                              </span>
                          ))}
                      </div>
                  )}

                  <div className="flex flex-wrap gap-8 text-sm">
                      <div className="flex flex-col">
                          <span className="font-bold text-xl text-gray-900">{userPosts.length}</span>
                          <span className="text-gray-500 font-medium">Posts</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="font-bold text-xl text-gray-900">{savedPlaces.length}</span>
                          <span className="text-gray-500 font-medium">Saved</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="font-bold text-xl text-gray-900">124</span>
                          <span className="text-gray-500 font-medium">Followers</span>
                      </div>
                      <div className="flex flex-col">
                          <span className="font-bold text-xl text-gray-900">89</span>
                          <span className="text-gray-500 font-medium">Following</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8 sticky top-20 bg-gray-50/80 backdrop-blur-md z-10 pt-2">
          <button 
              onClick={() => setActiveTab('saved')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm transition-colors border-b-2 ${
                  activeTab === 'saved' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
              <Bookmark size={18} className={activeTab === 'saved' ? 'fill-current' : ''} /> 
              Saved Places
          </button>
          <button 
              onClick={() => setActiveTab('posts')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm transition-colors border-b-2 ${
                  activeTab === 'posts' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
          >
              <Grid size={18} className={activeTab === 'posts' ? 'fill-current' : ''} /> 
              My Posts
          </button>
          {profile.is_guide && (
            <button 
                onClick={() => setActiveTab('packages')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm transition-colors border-b-2 ${
                    activeTab === 'packages' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
            >
                <Bookmark size={18} className={activeTab === 'packages' ? 'fill-current' : ''} /> 
                Tour Packages
            </button>
          )}
          {profile.is_guide && isCurrentUser && (
            <button 
                onClick={() => setActiveTab('requests')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 font-bold text-sm transition-colors border-b-2 ${
                    activeTab === 'requests' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
            >
                <Users size={18} className={activeTab === 'requests' ? 'fill-current' : ''} /> 
                Requests
            </button>
          )}
      </div>

      {/* Tab Content */}
      {activeTab === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPlaces.length > 0 ? (
                  savedPlaces.map(place => (
                      <PlaceCard 
                          key={place.id} 
                          place={{
                              name: place.name,
                              location: { lat: 0, lng: 0 },
                              address: place.address,
                              rating: place.rating,
                              photoUrl: place.photo_url,
                              tags: place.tags,
                              source: 'mapmingle'
                          }} 
                      />
                  ))
              ) : (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Bookmark size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No Saved Places</h3>
                      <p className="text-gray-500">When you save places on the map or feed, they'll appear here.</p>
                  </div>
              )}
          </div>
      )}


      {activeTab === 'posts' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-6">
              {userPosts.length > 0 ? (
                  userPosts.map(post => (
                      <div key={post.id} className="aspect-square bg-gray-100 relative group overflow-hidden rounded-2xl border border-gray-100 shadow-sm cursor-pointer">
                          <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white font-bold transition-opacity">
                              <span className="flex items-center gap-2"><Heart size={22} className="fill-current"/> {post.likes}</span>
                              <span className="flex items-center gap-2"><MessageCircle size={22} className="fill-current"/> {post.comments}</span>
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Grid size={24} className="text-gray-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No Posts Yet</h3>
                      <p className="text-gray-500">Photos shared with the community will show up on the profile.</p>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'packages' && profile.is_guide && (
          <div className="space-y-4 max-w-3xl mx-auto">
              {isCurrentUser && (
                  <button onClick={() => setIsPackageModalOpen(true)} className="mb-4 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md">
                      + Create New Tour Package
                  </button>
              )}
              {tourPackages.length > 0 ? (
                  tourPackages.map(pkg => (
                      <div key={pkg.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                          <div>
                              <h4 className="font-bold text-gray-900 text-lg mb-1">{pkg.title}</h4>
                              <p className="text-gray-600 mb-3 text-sm">{pkg.description}</p>
                              <div className="flex gap-4 text-xs font-bold text-gray-500">
                                  <span className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">{pkg.duration_hours} Hours</span>
                                  <span className="bg-gray-50 px-3 py-1 rounded-full border border-gray-100">Max {pkg.max_people} People</span>
                              </div>
                          </div>
                          <div className="text-right flex flex-col justify-between shrink-0">
                               <span className="text-2xl font-black text-indigo-600">${pkg.price}</span>
                               {!isCurrentUser && (
                                   <button className="bg-green-600 text-white px-4 py-2 text-sm font-bold rounded-xl mt-2 hover:bg-green-700">Request Tour</button>
                               )}
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <p className="text-gray-500 font-medium">No tour packages created yet.</p>
                  </div>
              )}
          </div>
      )}

      {activeTab === 'requests' && profile.is_guide && isCurrentUser && (
          <div className="space-y-4 max-w-3xl mx-auto">
              {bookingRequests.length > 0 ? (
                  bookingRequests.map(req => (
                      <div key={req.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <img src={req.user?.avatar_url || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full object-cover bg-gray-100" />
                              <div>
                                  <h4 className="font-bold text-gray-900">{req.user?.name} <span className="text-gray-500 text-sm font-normal">@{req.user?.username}</span></h4>
                                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                      <span className="font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">{req.package?.title}</span>
                                      • Status: <span className="capitalize font-bold">{req.status}</span>
                                  </p>
                                  {req.message && <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 p-2 rounded-lg">"{req.message}"</p>}
                              </div>
                          </div>
                          {req.status === 'pending' && (
                              <div className="flex gap-2">
                                  <button onClick={async () => {
                                      await dbServices.updateTourRequestStatus(req.id, 'accepted');
                                      setBookingRequests(await dbServices.getTourRequests());
                                  }} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition">Accept</button>
                                  <button onClick={async () => {
                                      await dbServices.updateTourRequestStatus(req.id, 'rejected');
                                      setBookingRequests(await dbServices.getTourRequests());
                                  }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition">Decline</button>
                              </div>
                          )}
                      </div>
                  ))
              ) : (
                  <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                          <Users size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No Booking Requests</h3>
                      <p className="text-gray-500">When travelers request tours with you, they'll appear here.</p>
                  </div>
              )}
          </div>
      )}

      {/* Edit Profile Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile">
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col items-center mb-2 relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-sm relative group cursor-pointer">
                      <img src={editAvatarPreview || profile.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-colors">
                          <Camera className="text-white" size={24} />
                      </div>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <span className="text-xs text-indigo-600 font-bold mt-2">Change Photo</span>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Name</label>
                  <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      required
                      minLength={2}
                      maxLength={50}
                  />
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                  <div className="relative">
                      <span className="absolute left-4 top-2.5 text-gray-400 font-bold">@</span>
                      <input 
                          type="text" 
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium lowercase"
                          required
                          minLength={3}
                          maxLength={30}
                          pattern="^[a-zA-Z0-9_]+$"
                          title="Username can only contain letters, numbers, and underscores"
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Bio</label>
                  <textarea 
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                      maxLength={500}
                  ></textarea>
              </div>

              {profile?.is_guide && (
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Expertise Regions</label>
                      <input 
                          type="text" 
                          value={editExpertise}
                          onChange={(e) => setEditExpertise(e.target.value)}
                          placeholder="e.g. Rome, Colosseum, Vatican (comma separated)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                  </div>
              )}

              <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 mt-2"
              >
                  {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
          </form>
      </Modal>

      {/* Package Creation Modal */}
      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="Create Tour Package">
          <form onSubmit={handleCreatePackage} className="flex flex-col gap-4">
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Package Title</label>
                  <input type="text" required minLength={5} maxLength={100} value={newPackage.title} onChange={e => setNewPackage({...newPackage, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Hidden Trastevere Food Tour"/>
              </div>
              <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                  <textarea required minLength={10} maxLength={1000} value={newPackage.description} onChange={e => setNewPackage({...newPackage, description: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500" placeholder="Describe the tour..."></textarea>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Price ($)</label>
                      <input type="number" required min="0" value={newPackage.price} onChange={e => setNewPackage({...newPackage, price: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Duration (Hrs)</label>
                      <input type="number" required min="0.5" step="0.5" value={newPackage.durationHours} onChange={e => setNewPackage({...newPackage, durationHours: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Max People</label>
                      <input type="number" required min="1" value={newPackage.maxPeople} onChange={e => setNewPackage({...newPackage, maxPeople: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500" />
                  </div>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 mt-2">
                  {isSaving ? 'Creating...' : 'Create Package'}
              </button>
          </form>
      </Modal>

    </div>
  );
};

export default Profile;
