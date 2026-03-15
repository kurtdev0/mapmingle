import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Guides from './pages/Guides';
import GuideDetails from './pages/GuideDetails';
import Essentials from './pages/Essentials';
import Planner from './pages/Planner';
import Exaggeration from './pages/Exaggeration';
import Profile from './pages/Profile'; // Added import
import DiscoverMap from './pages/DiscoverMap'; // Added import

import Modal from './components/Modal';

function App() {
  const [modalContent, setModalContent] = useState<{title: string, content: React.ReactNode} | null>(null);

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
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-100 py-10 mt-12">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
                <span className="font-serif text-lg font-bold text-gray-900 mb-4 md:mb-0">MapMingle</span>
                <div className="flex gap-6">
                    <button onClick={() => setModalContent({ title: 'Privacy Policy', content: <p>MapMingle values your privacy. We store minimal data necessary to provide personalized travel recommendations. We do not sell your data to third parties.</p> })} className="hover:text-indigo-600 transition-colors">Privacy</button>
                    <button onClick={() => setModalContent({ title: 'Terms of Service', content: <p>By using MapMingle, you agree to rely on our AI-generated recommendations at your own risk. Always verify critical travel information locally.</p> })} className="hover:text-indigo-600 transition-colors">Terms</button>
                    <button onClick={() => setModalContent({ title: 'About Us', content: <p>MapMingle is built for modern travelers and local guides who want to discover the undiscovered and avoid tourist traps.</p> })} className="hover:text-indigo-600 transition-colors">About</button>
                </div>
                <div className="mt-4 md:mt-0">
                    &copy; {new Date().getFullYear()} MapMingle.
                </div>
            </div>
        </footer>

        <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} title={modalContent?.title || ''}>
          <div className="text-gray-600">
             {modalContent?.content}
          </div>
        </Modal>
      </div>
    </Router>
  );
}

export default App;