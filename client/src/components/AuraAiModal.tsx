import React, { useState, useEffect, useRef } from 'react';
import { api, Movie } from '../services/api';
import { useDistrict } from '../context/DistrictContext';
import {
  Sparkles,
  Bot,
  Send,
  X,
  Smile,
  Flame,
  Plane,
  Ticket,
  Info,
  RefreshCw,
  Heart,
  ShieldCheck
} from 'lucide-react';

interface AuraAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: 'mood' | 'vibe' | 'travel' | null;
  onBookMovie: (movie: Movie) => void;
  onViewDetails: (movieId: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  movies?: Movie[];
  suggestions?: string[];
  timestamp: string;
}

export const AuraAiModal: React.FC<AuraAiModalProps> = ({
  isOpen,
  onClose,
  initialCategory = null,
  onBookMovie,
  onViewDetails
}) => {
  const { districtId } = useDistrict();
  
  const [activeTab, setActiveTab] = useState<'chat' | 'mood' | 'vibe' | 'travel'>(
    initialCategory || 'chat'
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<string | null>(null);
  const [selectedTravel, setSelectedTravel] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const moods = [
    'Happy', 'Sad', 'Romantic', 'Excited', 'Relaxed',
    'Energetic', 'Emotional', 'Adventurous', 'Scared', 'Motivated', 'Bored'
  ];

  const vibes = [
    'Feel-good', 'Mass', 'Chill', 'Romantic', 'Family',
    'Thriller', 'Comedy', 'Action', 'Emotional', 'Mind-bending', 'Fun', 'Adventure'
  ];

  const travelMoods = [
    'Long journey', 'Short trip', 'Night drive', 'Weekend outing',
    'Family trip', 'Friends trip', 'Solo travel', 'Relaxing travel'
  ];

  // Initialize chat greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          sender: 'ai',
          text: `Hi! I'm Aura AI 👋 How are you feeling today? Tell me your mood, vibe, or travel plan, and I'll find the perfect movie for you.`,
          suggestions: ['I want something feel-good', 'Exciting Mass action!', 'Going on a friends trip', 'I am feeling sad today'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    if (initialCategory) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (messageText?: string) => {
    const query = messageText || inputText;
    if (!query.trim() && !selectedMood && !selectedVibe && !selectedTravel) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query || `Matching preferences: ${[selectedMood, selectedVibe, selectedTravel].filter(Boolean).join(' • ')}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await api.chatWithAura({
        message: query,
        mood: selectedMood || undefined,
        vibe: selectedVibe || undefined,
        travelMood: selectedTravel || undefined,
        districtId
      });

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: res.reply,
        movies: res.recommendedMovies,
        suggestions: res.suggestions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: "I couldn't find a perfect match right now, but here are some popular movies currently playing!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
      setActiveTab('chat');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0b101c] border border-purple-500/30 rounded-3xl max-w-3xl w-full h-[650px] flex flex-col shadow-2xl shadow-purple-900/20 overflow-hidden relative">
        
        {/* Top Header */}
        <div className="p-4 px-6 border-b border-white/10 flex items-center justify-between bg-[#0e1626]/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-cyan-400 p-[2px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0a0e1a] rounded-[14px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white flex items-center space-x-1.5">
                  <span>Aura AI</span>
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Zero Spoilers Guaranteed
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Stories That Made for You • Content-Based Recommendation Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Mode Switcher Tabs */}
        <div className="flex items-center px-6 py-2 border-b border-white/5 bg-[#0d1424] space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat Assistant</span>
          </button>

          <button
            onClick={() => setActiveTab('mood')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'mood'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-purple-300" />
            <span>Mood System {selectedMood ? `(${selectedMood})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('vibe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'vibe'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-emerald-300" />
            <span>Vibe System {selectedVibe ? `(${selectedVibe})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('travel')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeTab === 'travel'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-cyan-300" />
            <span>Travel Mood {selectedTravel ? `(${selectedTravel})` : ''}</span>
          </button>
        </div>

        {/* Tab Content 1: Chat Feed */}
        {activeTab === 'chat' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-tr-none'
                      : 'bg-[#141d33] border border-white/10 text-gray-200 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Recommendation Cards if returned */}
                  {msg.movies && msg.movies.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                      <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                        Matched Stories For You:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.movies.map((mov) => (
                          <div
                            key={mov.id}
                            className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-amber-400/50 transition-all flex space-x-2.5 items-center group/card"
                          >
                            <img
                              src={mov.poster_url}
                              alt={mov.title}
                              className="w-12 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-white text-xs truncate group-hover/card:text-amber-400">
                                {mov.title}
                              </h5>
                              <p className="text-[10px] text-gray-400 truncate">
                                {mov.language} • {mov.genres.slice(0, 2).join(', ')}
                              </p>
                              <p className="text-[10px] text-amber-400 font-bold">
                                ⭐ {mov.rating} • {mov.certificate}
                              </p>
                              <div className="flex items-center space-x-1.5 mt-1.5">
                                <button
                                  onClick={() => {
                                    onClose();
                                    onBookMovie(mov);
                                  }}
                                  className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold"
                                >
                                  Book
                                </button>
                                <button
                                  onClick={() => {
                                    onClose();
                                    onViewDetails(mov.id);
                                  }}
                                  className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px]"
                                >
                                  Details
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestion Chips */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(sug)}
                          className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] text-gray-200 border border-white/10 transition-all"
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="block text-[9px] text-gray-500 mt-1 text-right">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-purple-300 bg-purple-500/10 p-3 rounded-2xl w-fit border border-purple-500/20 animate-pulse">
                <Bot className="w-4 h-4 animate-spin" />
                <span>Aura AI is analyzing mood, vibes and theatre availability...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Tab Content 2: Mood Picker */}
        {activeTab === 'mood' && (
          <div className="flex-1 overflow-y-auto p-6">
            <h4 className="text-sm font-bold text-white mb-2">How are you feeling right now?</h4>
            <p className="text-xs text-gray-400 mb-4">
              Select your mood. Aura AI features emotional mood protection to ensure you always get the right heartwarming or inspiring story.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {moods.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setSelectedMood(m);
                    handleSend(`My current mood is ${m}. Please suggest matching stories.`);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedMood === m
                      ? 'bg-purple-600/30 border-purple-500 text-white ring-1 ring-purple-500'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-bold text-white">{m}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {m === 'Sad' ? 'Comfort & Uplifting' : `${m} Cinematic vibe`}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 3: Vibe Picker */}
        {activeTab === 'vibe' && (
          <div className="flex-1 overflow-y-auto p-6">
            <h4 className="text-sm font-bold text-white mb-2">What's your cinematic vibe today?</h4>
            <p className="text-xs text-gray-400 mb-4">
              Choose the emotional rhythm or atmosphere you want to experience on the big screen.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {vibes.map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setSelectedVibe(v);
                    handleSend(`I'm looking for a ${v} vibe movie.`);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedVibe === v
                      ? 'bg-emerald-600/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-bold text-white">{v}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">High-energy experience</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 4: Travel Mood */}
        {activeTab === 'travel' && (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center space-x-2 mb-2">
              <Plane className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-bold text-white">Where are you heading?</h4>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Travelling soon? Let Aura AI plan the perfect movie journey for your trip style.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {travelMoods.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setSelectedTravel(t);
                    handleSend(`I am planning a ${t}. Recommend the best movie for this travel vibe!`);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedTravel === t
                      ? 'bg-cyan-600/30 border-cyan-500 text-white ring-1 ring-cyan-500'
                      : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/30 hover:bg-white/10'
                  }`}
                >
                  <p className="text-xs font-bold text-white">{t}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Curated travel journey</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 bg-[#0e1626] border-t border-white/10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Aura AI: 'I feel like watching something fun with friends'..."
              className="flex-1 px-4 py-3 rounded-2xl bg-[#090d16] border border-white/15 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-400 shadow-inner"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 disabled:opacity-40 text-white transition-all shadow-lg shadow-purple-600/25 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
