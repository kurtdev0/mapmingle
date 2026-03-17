import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { dbServices } from '../services/dbServices';
import { Settings, MapPin, Grid, Bookmark, Users, Star, Camera, X, Heart, MessageCircle, Shield, Package, CalendarDays, Clock, DollarSign, UserCheck, ChevronRight, Sparkles } from 'lucide-react';
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

          if (id && (!currentSessionProfile || id !== currentSessionProfile.id)) {
              isMe = false;
              targetProfile = await dbServices.getProfileById(id);
          }

          setProfile(targetProfile);
          setIsCurrentUser(isMe);

          if (isMe && targetProfile) {
              setEditName(targetProfile.name || '');
              setEditUsername(targetProfile.username || '');
              setEditBio(targetProfile.bio || '');
              setEditExpertise(targetProfile.expertise ? targetProfile.expertise.join(', ') : '');
          }

          if (targetProfile) {
              const posts = await dbServices.getUserPosts(targetProfile.id);
              setUserPosts(posts);
          }

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

          if (targetProfile && isMe) {
              const places = await dbServices.getSavedPlaces();
              setSavedPlaces(places);
          } else {
              setSavedPlaces([]);
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
          alert("Verification request submitted! We will review your profile shortly.");
          setProfile(prev => prev ? { ...prev, isVerified: true } : prev);
      } catch (err) {
          console.error("Failed to request verification", err);
      }
  };

  if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium animate-pulse">Loading Profile...</p>
          </div>
        </div>
      );
  }

  if (!profile) {
      return (
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
                  <Users size={36} className="text-indigo-500" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Not Logged In</h2>
              <p className="text-gray-500 text-lg">Please log in to view your profile and saved places.</p>
          </div>
      );
  }

  const statItems = [
    { label: 'Posts', value: userPosts.length, icon: Grid },
    { label: 'Saved', value: savedPlaces.length, icon: Bookmark },
    { label: 'Followers', value: 124, icon: UserCheck },
    { label: 'Following', value: 89, icon: Users },
  ];

  const tabs = [
    { key: 'saved' as const, label: 'Saved', icon: Bookmark, show: true },
    { key: 'posts' as const, label: 'Posts', icon: Grid, show: true },
    { key: 'packages' as const, label: 'Packages', icon: Package, show: profile.is_guide },
    { key: 'requests' as const, label: 'Requests', icon: Users, show: profile.is_guide && isCurrentUser },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* ═══════ PROFILE HEADER ═══════ */}
      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl shadow-indigo-100/50">
        
        {/* Cover gradient */}
        <div className="h-44 md:h-52 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-500 relative">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
          {/* Decorative blur circles */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute top-5 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        </div>
        
        {/* Profile card body */}
        <div className="bg-white px-6 md:px-10 pb-8 pt-0 relative">

          {/* Avatar row */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-14 relative z-10">
            
            {/* Avatar */}
            <div className="relative shrink-0 group">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl bg-gray-100 ring-4 ring-indigo-50">
                <img 
                    src={profile.avatar_url} 
                    alt={profile.name} 
                    className="w-full h-full object-cover"
                />
              </div>
              {profile.is_guide && (
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg border-2 border-white shadow-lg flex items-center gap-1 uppercase tracking-wider">
                  <Star size={10} className="fill-current" /> Guide
                </div>
              )}
            </div>

            {/* Name & actions */}
            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">{profile.name}</h1>
                  {profile.is_guide && <Shield className="text-indigo-600 fill-indigo-50" size={22} />}
                  {profile.isVerified && (
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-sm">
                      <Shield size={12} className="fill-current" /> Verified
                    </span>
                  )}
                </div>
                {profile.username && (
                  <p className="text-gray-400 font-medium mt-0.5">@{profile.username}</p>
                )}
              </div>

              {isCurrentUser && (
                <div className="flex gap-2 shrink-0">
                  {profile.is_guide && !profile.isVerified && (
                    <button onClick={handleRequestVerification} className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold flex gap-2 items-center hover:shadow-lg hover:shadow-blue-200 transition-all text-sm">
                      <Shield size={15} /> Get Verified
                    </button>
                  )}
                  <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold flex gap-2 items-center transition-all text-sm text-gray-700">
                    <Settings size={16} /> Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-gray-600 mt-5 max-w-2xl leading-relaxed text-[15px]">{profile.bio}</p>
          )}

          {/* Expertise tags */}
          {profile.is_guide && profile.expertise && profile.expertise.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {profile.expertise.map((area: string, i: number) => (
                <span key={i} className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:shadow-sm transition-shadow">
                  <MapPin size={11} className="text-indigo-400" /> {area}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-4 gap-4">
            {statItems.map((stat, i) => (
              <div key={i} className="text-center group cursor-default">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <stat.icon size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                  <span className="font-black text-xl text-gray-900 group-hover:text-indigo-600 transition-colors">{stat.value}</span>
                </div>
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ TABS ═══════ */}
      <div className="flex gap-1.5 mb-8 bg-gray-100/80 p-1.5 rounded-2xl sticky top-20 z-10 backdrop-blur-md shadow-sm">
        {tabs.filter(t => t.show).map(tab => (
          <button 
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3 font-bold text-sm rounded-xl transition-all duration-200 ${
              activeTab === tab.key 
                ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100/50' 
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <tab.icon size={16} className={activeTab === tab.key ? 'fill-indigo-100' : ''} /> 
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════ TAB CONTENT ═══════ */}

      {/* ── Saved Places ── */}
      {activeTab === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in">
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
                  <div className="col-span-full text-center py-20 bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-3">
                          <Bookmark size={24} className="text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No Saved Places</h3>
                      <p className="text-gray-500 max-w-xs mx-auto">When you save places on the map or feed, they'll appear here.</p>
                  </div>
              )}
          </div>
      )}

      {/* ── Posts Grid ── */}
      {activeTab === 'posts' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5 animate-in">
              {userPosts.length > 0 ? (
                  userPosts.map((post, idx) => (
                      <div key={post.id} className="aspect-square bg-gray-100 relative group overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1" style={{ animationDelay: `${idx * 50}ms` }}>
                          <img src={post.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-center gap-6 text-white">
                              <span className="flex items-center gap-2 font-bold text-sm">
                                <Heart size={18} className="fill-current drop-shadow-sm"/> {post.likes}
                              </span>
                              <span className="flex items-center gap-2 font-bold text-sm">
                                <MessageCircle size={18} className="fill-current drop-shadow-sm"/> {post.comments}
                              </span>
                            </div>
                          </div>
                          {/* Post number badge */}
                          <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {idx + 1}
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="col-span-full text-center py-20 bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 -rotate-3">
                          <Grid size={24} className="text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No Posts Yet</h3>
                      <p className="text-gray-500 max-w-xs mx-auto">Photos shared with the community will show up on your profile.</p>
                  </div>
              )}
          </div>
      )}

      {/* ── Tour Packages ── */}
      {activeTab === 'packages' && profile.is_guide && (
          <div className="space-y-5 max-w-3xl mx-auto animate-in">
              {isCurrentUser && (
                  <button onClick={() => setIsPackageModalOpen(true)} className="w-full py-4 rounded-2xl border-2 border-dashed border-indigo-200 text-indigo-600 font-bold hover:bg-indigo-50 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 group">
                      <Sparkles size={18} className="group-hover:rotate-12 transition-transform" /> Create New Tour Package
                  </button>
              )}
              {tourPackages.length > 0 ? (
                  tourPackages.map((pkg, idx) => (
                      <div key={pkg.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col sm:flex-row justify-between gap-5" style={{ animationDelay: `${idx * 80}ms` }}>
                          <div className="flex-1">
                              <h4 className="font-bold text-gray-900 text-lg mb-2 flex items-center gap-2">
                                {pkg.title}
                                <ChevronRight size={16} className="text-gray-300" />
                              </h4>
                              <p className="text-gray-500 mb-4 text-sm leading-relaxed">{pkg.description}</p>
                              <div className="flex gap-3 flex-wrap">
                                  <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-indigo-100">
                                    <Clock size={12} /> {pkg.duration_hours}h
                                  </span>
                                  <span className="bg-purple-50 text-purple-700 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-purple-100">
                                    <Users size={12} /> Max {pkg.max_people}
                                  </span>
                              </div>
                          </div>
                          <div className="text-right flex flex-col justify-between shrink-0 items-end">
                               <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl">
                                 <span className="text-2xl font-black">${pkg.price}</span>
                                 <span className="text-indigo-200 text-xs font-medium ml-1">/person</span>
                               </div>
                               {!isCurrentUser && (
                                   <button className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-5 py-2.5 text-sm font-bold rounded-xl mt-3 hover:shadow-lg hover:shadow-green-200 transition-all flex items-center gap-1.5">
                                     <CalendarDays size={14} /> Book Tour
                                   </button>
                               )}
                          </div>
                      </div>
                  ))
              ) : (
                  <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Package size={24} className="text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No tour packages yet</h3>
                      <p className="text-gray-500">Create your first tour package to attract travelers.</p>
                  </div>
              )}
          </div>
      )}

      {/* ── Booking Requests ── */}
      {activeTab === 'requests' && profile.is_guide && isCurrentUser && (
          <div className="space-y-4 max-w-3xl mx-auto animate-in">
              {bookingRequests.length > 0 ? (
                  bookingRequests.map(req => (
                      <div key={req.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                              <div className="relative">
                                <img src={req.user?.avatar_url || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-xl object-cover bg-gray-100 ring-2 ring-gray-50" />
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${req.status === 'pending' ? 'bg-amber-400' : req.status === 'accepted' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                              </div>
                              <div>
                                  <h4 className="font-bold text-gray-900">{req.user?.name} <span className="text-gray-400 text-sm font-normal">@{req.user?.username}</span></h4>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="font-medium bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg text-xs border border-indigo-100">{req.package?.title}</span>
                                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-lg capitalize ${
                                      req.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                      req.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-100' :
                                      'bg-red-50 text-red-700 border border-red-100'
                                    }`}>{req.status}</span>
                                  </div>
                                  {req.message && <p className="text-sm text-gray-500 mt-2 italic bg-gray-50 p-2.5 rounded-xl">"{req.message}"</p>}
                              </div>
                          </div>
                          {req.status === 'pending' && (
                              <div className="flex gap-2 shrink-0">
                                  <button onClick={async () => {
                                      await dbServices.updateTourRequestStatus(req.id, 'accepted');
                                      setBookingRequests(await dbServices.getTourRequests());
                                  }} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all">Accept</button>
                                  <button onClick={async () => {
                                      await dbServices.updateTourRequestStatus(req.id, 'rejected');
                                      setBookingRequests(await dbServices.getTourRequests());
                                  }} className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">Decline</button>
                              </div>
                          )}
                      </div>
                  ))
              ) : (
                  <div className="text-center py-20 bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-100 shadow-sm">
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users size={24} className="text-indigo-400" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">No Booking Requests</h3>
                      <p className="text-gray-500">When travelers request tours with you, they'll appear here.</p>
                  </div>
              )}
          </div>
      )}

      {/* ═══════ EDIT PROFILE MODAL ═══════ */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Profile">
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-5">
              
              <div className="flex flex-col items-center mb-2 relative">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 border-4 border-white shadow-lg relative group cursor-pointer ring-4 ring-indigo-50">
                      <img src={editAvatarPreview || profile.avatar_url || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center transition-colors rounded-2xl">
                          <Camera className="text-white" size={24} />
                      </div>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                  <span className="text-xs text-indigo-600 font-bold mt-2.5 hover:text-indigo-800 cursor-pointer">Change Photo</span>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Name</label>
                  <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all"
                      required
                      minLength={2}
                      maxLength={50}
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Username</label>
                  <div className="relative">
                      <span className="absolute left-4 top-3 text-gray-400 font-bold text-sm">@</span>
                      <input 
                          type="text" 
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium lowercase transition-all"
                          required
                          minLength={3}
                          maxLength={30}
                          pattern="^[a-zA-Z0-9_]+$"
                          title="Username can only contain letters, numbers, and underscores"
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Bio</label>
                  <textarea 
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                      maxLength={500}
                      placeholder="Tell travelers about yourself..."
                  ></textarea>
                  <p className="text-right text-[11px] text-gray-400 mt-1">{editBio.length}/500</p>
              </div>

              {profile?.is_guide && (
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Expertise Regions</label>
                      <input 
                          type="text" 
                          value={editExpertise}
                          onChange={(e) => setEditExpertise(e.target.value)}
                          placeholder="e.g. Rome, Colosseum, Vatican (comma separated)"
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all"
                      />
                  </div>
              )}

              <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 mt-1"
              >
                  {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
          </form>
      </Modal>

      {/* ═══════ PACKAGE CREATION MODAL ═══════ */}
      <Modal isOpen={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title="Create Tour Package">
          <form onSubmit={handleCreatePackage} className="flex flex-col gap-5">
              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Package Title</label>
                  <input type="text" required minLength={5} maxLength={100} value={newPackage.title} onChange={e => setNewPackage({...newPackage, title: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-medium" placeholder="e.g. Hidden Trastevere Food Tour"/>
              </div>
              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea required minLength={10} maxLength={1000} value={newPackage.description} onChange={e => setNewPackage({...newPackage, description: e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-none" placeholder="Describe the tour experience..."></textarea>
              </div>
              <div className="grid grid-cols-3 gap-4">
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1"><DollarSign size={11} /> Price</label>
                      <input type="number" required min="0" value={newPackage.price} onChange={e => setNewPackage({...newPackage, price: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-bold" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Clock size={11} /> Duration</label>
                      <input type="number" required min="0.5" step="0.5" value={newPackage.durationHours} onChange={e => setNewPackage({...newPackage, durationHours: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-bold" />
                  </div>
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1"><Users size={11} /> People</label>
                      <input type="number" required min="1" value={newPackage.maxPeople} onChange={e => setNewPackage({...newPackage, maxPeople: Number(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-bold" />
                  </div>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-green-200 transition-all disabled:opacity-50 mt-1">
                  {isSaving ? 'Creating...' : 'Create Package'}
              </button>
          </form>
      </Modal>

    </div>
  );
};

export default Profile;
