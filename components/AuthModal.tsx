import React, { useState } from 'react';
import { X, Mail, Lock } from 'lucide-react';
import { dbServices } from '../services/dbServices';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await dbServices.signIn(email, password);
      } else {
        await dbServices.signUp(email, password, fullName);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 animate-fade-in text-left font-sans">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-scale-up">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-2xl font-serif font-bold text-gray-900">
             {isLogin ? 'Welcome Back' : 'Join MapMingle'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                   <input 
                     type="text" 
                     className="w-full border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" 
                     placeholder="John Doe" 
                     value={fullName}
                     onChange={(e) => setFullName(e.target.value)}
                     required={!isLogin} 
                   />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Mail size={16} className="text-gray-400" />
                 </div>
                 <input 
                   type="email" 
                   className="w-full border-gray-200 rounded-xl p-3 pl-10 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" 
                   placeholder="you@example.com" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   required 
                 />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <Lock size={16} className="text-gray-400" />
                 </div>
                 <input 
                   type="password" 
                   className="w-full border-gray-200 rounded-xl p-3 pl-10 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none" 
                   placeholder="••••••••" 
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   minLength={6}
                   required 
                 />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 mt-2"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Log In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-6 text-center">
             <button 
               type="button"
               onClick={() => { setIsLogin(!isLogin); setError(''); }}
               className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
             >
               {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
