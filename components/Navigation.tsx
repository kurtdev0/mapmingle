import React, { useState, useEffect } from 'react';
import { Map, Users, Compass, Droplet, Calendar, Menu, X, Layout, Target } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import AuthModal from './AuthModal';
import { dbServices } from '../services/dbServices';
import { supabase } from '../services/supabase';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    loadProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async () => {
    const p = await dbServices.getCurrentProfile();
    setProfile(p);
  };

  const handleSignOut = async () => {
    await dbServices.signOut();
    setProfile(null);
  };

  const navItems = [
    { name: 'Feed',        path: '/feed',        icon: Layout  },
    { name: 'Discover',    path: '/discover',    icon: Map     },
    { name: 'Hidden Gems', path: '/',            icon: Compass },
    { name: 'Guides',      path: '/guides',      icon: Users   },
    { name: 'Essentials',  path: '/essentials',  icon: Droplet },
    { name: 'Planner',     path: '/planner',     icon: Calendar},
    { name: 'Truth Scale', path: '/exaggeration',icon: Target  },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Floating pill navbar */}
      <div className="sticky top-0 z-50 pointer-events-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3">
          <nav className="pointer-events-auto bg-white/85 backdrop-blur-xl border border-gray-200/70 rounded-2xl shadow-sm flex items-center justify-between h-14 px-3 sm:px-4">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm shadow-indigo-600/20 group-hover:bg-indigo-700 transition-colors">
                <Compass size={16} className="text-white" />
              </div>
              <span className="font-bold text-gray-900 tracking-tight">MapMingle</span>
            </Link>

            {/* Desktop nav — text only, no icons */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(item.path)
                      ? 'bg-gray-950 text-white'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side: auth + mobile trigger */}
            <div className="flex items-center gap-2">
              {/* Auth — desktop */}
              <div className="hidden lg:block">
                {profile ? (
                  <div className="relative group/profile">
                    <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1.5 rounded-xl transition-colors">
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      />
                      <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">{profile.name}</span>
                    </Link>
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full pt-2 w-48 z-50 hidden group-hover/profile:block">
                      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 py-2 animate-scale-in">
                        <div className="px-4 py-2.5 border-b border-gray-50 mb-1">
                          <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                          <p className="text-xs text-gray-400 truncate">@{profile.username}</p>
                        </div>
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                          View Profile
                        </Link>
                        <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 font-medium transition-colors">
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="bg-gray-950 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>

              {/* Mobile: auth pill + hamburger */}
              <div className="flex items-center gap-2 lg:hidden">
                {profile ? (
                  <Link to="/profile">
                    <img src={profile.avatar_url} alt={profile.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                  </Link>
                ) : (
                  <button
                    onClick={() => setIsAuthOpen(true)}
                    className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg"
                  >
                    Sign In
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  {isOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile dropdown — sits right below the pill */}
          {isOpen && (
            <div className="pointer-events-auto mt-1.5 bg-white/95 backdrop-blur-xl border border-gray-200/70 rounded-2xl shadow-lg overflow-hidden animate-slide-down">
              <div className="p-2 grid grid-cols-2 gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive(item.path)
                          ? 'bg-gray-950 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={16} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => setIsAuthOpen(false)}
      />
    </>
  );
};

export default Navigation;
