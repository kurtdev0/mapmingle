import React, { useState, useEffect } from 'react';
import { Map, Users, Compass, Droplet, Calendar, Menu, X, Camera, Layout } from 'lucide-react';
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

     // Listen for auth changes to update UI across tabs/modals
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
    { name: 'Feed', path: '/feed', icon: <Layout size={20} /> },
    { name: 'Hidden Gems', path: '/', icon: <Compass size={20} /> },
    { name: 'Guides', path: '/guides', icon: <Users size={20} /> },
    { name: 'Essentials', path: '/essentials', icon: <Droplet size={20} /> },
    { name: 'Planner', path: '/planner', icon: <Calendar size={20} /> },
    { name: 'Truth Scale', path: '/exaggeration', icon: <Map size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="bg-indigo-600 p-2.5 rounded-xl group-hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20">
                <Compass className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-2xl tracking-tight text-gray-900">MapMingle</span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex lg:space-x-1 lg:items-center">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            <div className="ml-2 pl-2 border-l border-gray-200">
                {profile ? (
                    <div className="relative group/profile">
                        <Link to="/profile" className="flex items-center gap-2 hover:bg-gray-50 p-1.5 rounded-full transition-colors cursor-pointer">
                            <img src={profile.avatar_url} alt={profile.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                        </Link>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 hidden group-hover/profile:block opacity-0 group-hover/profile:opacity-100 transition-opacity">
                            <div className="px-4 py-2 border-b border-gray-50 mb-2">
                                <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                                <p className="text-xs text-gray-500 truncate">@{profile.username}</p>
                            </div>
                            <Link to="/profile" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                                View Profile
                            </Link>
                            <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors">
                                Sign Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsAuthOpen(true)} className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-800 transition-colors shadow-md whitespace-nowrap">
                        Login / Sign Up
                    </button>
                )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden gap-3">
             {!profile && (
                 <button onClick={() => setIsAuthOpen(true)} className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg active:scale-95">
                     Login
                 </button>
             )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 absolute w-full shadow-lg">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-4 py-3 rounded-lg text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>

    <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onSuccess={() => setIsAuthOpen(false)}
    />
    </>
  );
};

export default Navigation;