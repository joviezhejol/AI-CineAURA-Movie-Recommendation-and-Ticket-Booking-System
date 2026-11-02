import React from 'react';
import { Sparkles, Smile, Flame, Plane, ChevronRight, Bot } from 'lucide-react';

interface AuraAiWidgetProps {
  onOpenWithCategory: (category: 'mood' | 'vibe' | 'travel') => void;
}

export const AuraAiWidget: React.FC<AuraAiWidgetProps> = ({ onOpenWithCategory }) => {
  return (
    <div className="h-[440px] lg:h-[460px] rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between bg-gradient-to-b from-[#131b2e] via-[#0e1626] to-[#0a0f1d] border border-purple-500/25 shadow-2xl shadow-purple-900/10 group">
      
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Header */}
      <div className="relative z-10">
        <div className="flex items-center space-x-2 mb-1">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
            Aura AI
          </h2>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
        <p className="text-xs text-gray-400">
          Find the story that matches your mood.
        </p>
      </div>

      {/* Robot Greeting Speech Bubble */}
      <div className="relative z-10 my-auto py-2">
        <div className="flex items-start space-x-3.5">
          {/* 3D Glowing Bot Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-[#0a0e1a] rounded-[14px] flex items-center justify-center">
                <Bot className="w-7 h-7 text-cyan-300 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0a0e1a] flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
            </div>
          </div>

          {/* Dialog Bubble */}
          <div className="flex-1 p-3.5 rounded-2xl bg-white/[0.06] backdrop-blur-md border border-white/10 text-xs text-gray-200 leading-relaxed shadow-lg">
            <p className="font-semibold text-white mb-1">Hi! I'm Aura AI 👋</p>
            <p className="text-gray-300 text-[11px] leading-snug">
              Tell me your mood, vibe, or travel plan, and I'll find the perfect movie for you.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Interactive Buttons (Mood, Vibe, Travel Mood) */}
      <div className="relative z-10 space-y-2.5">
        
        {/* Mood Button */}
        <button
          onClick={() => onOpenWithCategory('mood')}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-400/50 transition-all text-left group/btn transform hover:-translate-y-0.5"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
              <Smile className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover/btn:text-purple-300 transition-colors">
                Mood
              </p>
              <p className="text-[10px] text-gray-400">
                How do you feel?
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover/btn:translate-x-1 transition-transform" />
        </button>

        {/* Vibe Button */}
        <button
          onClick={() => onOpenWithCategory('vibe')}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400/50 transition-all text-left group/btn transform hover:-translate-y-0.5"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover/btn:text-emerald-300 transition-colors">
                Vibe
              </p>
              <p className="text-[10px] text-gray-400">
                What's your vibe today?
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-400 group-hover/btn:translate-x-1 transition-transform" />
        </button>

        {/* Travel Mood Button */}
        <button
          onClick={() => onOpenWithCategory('travel')}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/50 transition-all text-left group/btn transform hover:-translate-y-0.5"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
              <Plane className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white group-hover/btn:text-cyan-300 transition-colors">
                Travel Mood
              </p>
              <p className="text-[10px] text-gray-400">
                Where are you going?
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-cyan-400 group-hover/btn:translate-x-1 transition-transform" />
        </button>

      </div>
    </div>
  );
};
