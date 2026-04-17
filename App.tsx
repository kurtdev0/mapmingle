import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Compass, Map, Users, Calendar, Droplet, Target, Layout } from 'lucide-react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Guides from './pages/Guides';
import GuideDetails from './pages/GuideDetails';
import Essentials from './pages/Essentials';
import Planner from './pages/Planner';
import Exaggeration from './pages/Exaggeration';
import Profile from './pages/Profile';
import DiscoverMap from './pages/DiscoverMap';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

const footerNav = [
  { name: 'Feed',         path: '/feed',        icon: Layout  },
  { name: 'Discover',     path: '/discover',    icon: Map     },
  { name: 'Hidden Gems',  path: '/',            icon: Compass },
  { name: 'Guides',       path: '/guides',      icon: Users   },
  { name: 'Essentials',   path: '/essentials',  icon: Droplet },
  { name: 'Planner',      path: '/planner',     icon: Calendar},
  { name: 'Truth Scale',  path: '/exaggeration',icon: Target  },
];

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <Navigation />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/discover" element={<DiscoverMap />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:id" element={<GuideDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/essentials" element={<Essentials />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/exaggeration" element={<Exaggeration />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </main>

        <footer className="bg-gray-950 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-white/10">

              {/* Brand */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-600/30">
                    <Compass className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">MapMingle</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                  Discover the undiscovered. Escape tourist traps and find hidden gems, secret spots, and local favorites that guidebooks miss.
                </p>
              </div>

              {/* Explore links */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Explore</h4>
                <ul className="space-y-2.5">
                  {footerNav.map(({ name, path, icon: Icon }) => (
                    <li key={path}>
                      <Link to={path} className="flex items-center gap-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium group">
                        <Icon size={14} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company links */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Company</h4>
                <ul className="space-y-2.5">
                  <li>
                    <Link to="/about" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                      About
                    </Link>
                  </li>
                  <li>
                    <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} MapMingle. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
