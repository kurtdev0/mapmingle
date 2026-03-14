import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MoreVertical } from 'lucide-react';

import { dbServices } from '../services/dbServices';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientAvatar: string;
  recipientId: string; // NEW REQUIRED PROP
}

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, recipientName, recipientAvatar, recipientId }) => {
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && recipientId) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [isOpen, recipientId]);

  const loadHistory = async () => {
      setLoading(true);
      try {
          const profile = await dbServices.getCurrentProfile();
          if (!profile) return;
          
          const rawMessages = await dbServices.getMessages(recipientId);
          const formatted = rawMessages.map(msg => ({
              id: msg.id,
              text: msg.content,
              sender: msg.sender_id === profile.id ? 'me' : 'them',
              time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })) as Message[];
          
          setHistory(formatted);
      } catch (err) {
          console.error("Failed to load chat history", err);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !recipientId) return;

    const tempId = Date.now().toString();
    const newItem: Message = {
      id: tempId,
      text: message,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setHistory(prev => [...prev, newItem]);
    setMessage('');

    try {
        await dbServices.sendMessage(recipientId, newItem.text);
        // In a real app we would subscribe to realtime inserts here. 
        // For now, we will just rely on the optimistic update.
    } catch (err) {
        console.error("Failed to send message", err);
        setHistory(prev => prev.filter(m => m.id !== tempId)); // revert on fail
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="relative bg-white w-full max-w-md h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
             <div className="relative">
                <img src={recipientAvatar} alt={recipientName} className="w-10 h-10 rounded-full object-cover" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
             </div>
             <div>
                <h3 className="font-bold text-gray-900 text-sm">{recipientName}</h3>
                <p className="text-xs text-green-600 font-medium">Online now</p>
             </div>
          </div>
          <div className="flex gap-2 text-gray-400">
            <button className="p-2 hover:bg-gray-50 rounded-full"><MoreVertical size={20} /></button>
            <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full text-gray-500"><X size={20} /></button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50" ref={scrollRef}>
          <div className="text-center text-xs text-gray-400 my-4">Today</div>
          {history.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.sender === 'me' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
              }`}>
                {msg.text}
                <div className={`text-[10px] mt-1 text-right ${msg.sender === 'me' ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {msg.time}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-2 items-end">
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-100 border-0 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all max-h-32"
            />
            <button 
              type="submit" 
              disabled={!message.trim()}
              className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-md shadow-indigo-200"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
