import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Film, User, Building2, Shield, Eye, EyeOff,
  Star, Sparkles, ArrowLeft, Ticket, Lock,
  CheckCircle2
} from 'lucide-react';

type UserType = 'customer' | 'manager' | 'employee';
type AuthMode = 'select' | 'login' | 'register';

interface LoginPageProps {
  onLoginSuccess: (role: UserType) => void;
  onBack: () => void;
}

const PORTALS = [
  {
    type: 'customer' as UserType,
    label: 'Customer',
    sublabel: 'Book tickets & discover movies',
    icon: User,
    emoji: '🎬',
    accent: 'amber',
    features: ['AI Movie Recommendations', 'Seat Selection & Booking', 'Digital QR Tickets', 'Watchlist & Bookings'],
    border: 'border-amber-500/50',
    glow: 'shadow-amber-500/20',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    btn: 'from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-amber-500/30',
    ring: 'ring-amber-400',
    demoEmail: 'customer@cineaura.com',
  },
  {
    type: 'manager' as UserType,
    label: 'Theatre Owner',
    sublabel: 'Manage your cinema business',
    icon: Building2,
    emoji: '🏛️',
    accent: 'purple',
    features: ['Show Scheduling', 'Revenue Analytics', 'Seat Management', 'Occupancy Reports'],
    border: 'border-purple-500/50',
    glow: 'shadow-purple-500/20',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    btn: 'from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 shadow-purple-500/30',
    ring: 'ring-purple-400',
    demoEmail: 'manager@cineaura.com',
  },
  {
    type: 'employee' as UserType,
    label: 'Theatre Employee',
    sublabel: 'Verify tickets & manage entry',
    icon: Shield,
    emoji: '📱',
    accent: 'cyan',
    features: ['QR Ticket Scanning', 'Show Status View', 'Entry Verification', 'Live Seat Updates'],
    border: 'border-cyan-500/50',
    glow: 'shadow-cyan-500/20',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    btn: 'from-cyan-500 to-cyan-700 hover:from-cyan-400 hover:to-cyan-600 shadow-cyan-500/30',
    ring: 'ring-cyan-400',
    demoEmail: 'employee@cineaura.com',
  },
] as const;

// Cinematic background using movie poster collage effect
const BG_POSTERS = [
  '/posters/avengers_endgame.jpg',
  '/posters/premalu.jpg',
  '/posters/amaran.jpg',
  '/posters/interstellar.jpg',
  '/posters/stree2.jpg',
  '/posters/spiderman.jpg',
  '/posters/vettaiyan.jpg',
  '/posters/leo.jpg',
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBack }) => {
  const { login, register, switchRole } = useAuth();
  const [mode, setMode] = useState<AuthMode>('select');
  const [selectedPortal, setSelectedPortal] = useState<typeof PORTALS[number]>(PORTALS[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const openPortal = (portal: typeof PORTALS[number]) => {
    setSelectedPortal(portal);
    setMode('login');
    setError(''); setSuccess('');
    setEmail(''); setPassword(''); setName(''); setPhone('');
  };

  const handleDemoLogin = async () => {
    setIsLoading(true); setError('');
    try {
      await switchRole(selectedPortal.type);
      setSuccess(`Welcome! Logging in as ${selectedPortal.label}...`);
      setTimeout(() => onLoginSuccess(selectedPortal.type), 800);
    } catch {
      onLoginSuccess(selectedPortal.type);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError('');
    try {
      const res = await login(email, password);
      if (res.success) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => onLoginSuccess(selectedPortal.type), 700);
      } else {
        setError(res.error || 'Invalid credentials.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill all required fields.'); return;
    }
    setIsLoading(true); setError('');
    try {
      const res = await register({ name, email, password, phone, role: 'customer' });
      if (res.success) {
        setSuccess('Account created! Welcome to CineAura!');
        setTimeout(() => onLoginSuccess('customer'), 800);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080f] flex overflow-hidden">

      {/* ── LEFT PANEL: Cinematic Poster Collage ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] relative flex-col overflow-hidden">
        {/* Poster mosaic background */}
        <div className="absolute inset-0 grid grid-cols-2 gap-1 opacity-60">
          {BG_POSTERS.map((src, i) => (
            <div key={i} className="overflow-hidden">
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                style={{ aspectRatio: '2/3' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          ))}
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#06080f]/20 via-[#06080f]/10 to-[#06080f]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080f] via-transparent to-[#06080f]/60" />

        {/* Branding content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Film className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-lg font-black text-white">AI CineAura</span>
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">PRO</span>
            </div>
          </div>

          {/* Center Quote */}
          <div className="space-y-4">
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-3xl font-black text-white leading-tight">
              "Stories That Are<br />
              <span className="text-amber-400">Made for You.</span>"
            </blockquote>
            <p className="text-sm text-gray-400 max-w-xs">
              Premium AI-powered movie discovery and ticket booking for Tamil Nadu's finest cinemas.
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 text-xs text-gray-500">
            <div className="text-center">
              <p className="text-lg font-black text-white">50K+</p>
              <p>Bookings</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-black text-white">20+</p>
              <p>Movies</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-lg font-black text-amber-400">4.9★</p>
              <p>Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth Forms ── */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-10 max-w-lg mx-auto w-full">

          {/* Back button */}
          <button
            onClick={mode === 'select' ? onBack : () => { setMode('select'); setError(''); }}
            className="flex items-center space-x-2 text-gray-500 hover:text-white transition-colors text-sm mb-8 self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{mode === 'select' ? 'Back to Home' : 'Choose Portal'}</span>
          </button>

          {/* ── PORTAL SELECTION ── */}
          {mode === 'select' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black text-white mb-1">Welcome Back</h1>
                <p className="text-gray-400 text-sm">Select your portal to continue</p>
              </div>

              <div className="space-y-3">
                {PORTALS.map((portal) => {
                  const Icon = portal.icon;
                  return (
                    <button
                      key={portal.type}
                      onClick={() => openPortal(portal)}
                      className={`w-full p-5 rounded-2xl border ${portal.border} bg-gradient-to-br ${portal.gradient} hover:scale-[1.01] active:scale-[0.99] transition-all text-left group shadow-lg ${portal.glow}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-11 h-11 rounded-xl border ${portal.border} flex items-center justify-center text-2xl bg-black/30`}>
                            {portal.emoji}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{portal.label}</h3>
                            <p className="text-xs text-gray-400">{portal.sublabel}</p>
                          </div>
                        </div>
                        <div className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${portal.badge} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          Enter →
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {portal.features.map((f) => (
                          <span key={f} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${portal.badge}`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>

              <p className="text-center text-xs text-gray-600">
                <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
                All portals have demo credentials for instant access
              </p>
            </div>
          )}

          {/* ── LOGIN / REGISTER FORM ── */}
          {(mode === 'login' || mode === 'register') && (
            <div className="space-y-6">
              {/* Portal header */}
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-2xl border ${selectedPortal.border} flex items-center justify-center text-2xl bg-black/40`}>
                  {selectedPortal.emoji}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{selectedPortal.label} Portal</h2>
                  <p className="text-xs text-gray-400">{selectedPortal.sublabel}</p>
                </div>
              </div>

              {/* Tab switcher for customer */}
              {selectedPortal.type === 'customer' && (
                <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                  <button
                    onClick={() => { setMode('login'); setError(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'login' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { setMode('register'); setError(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'register' ? 'bg-white/15 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Create Account
                  </button>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {error}
                </div>
              )}

              {/* Login Form */}
              {mode === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={selectedPortal.demoEmail}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 bottom-3 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${selectedPortal.btn} text-white font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Signing in...</span>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        <span>Sign In as {selectedPortal.label}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Register Form */}
              {mode === 'register' && selectedPortal.type === 'customer' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-semibold text-gray-400 mb-1.5">Password *</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 bottom-3 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-xl bg-gradient-to-r ${selectedPortal.btn} text-white font-black text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center space-x-2`}
                  >
                    {isLoading ? <span className="animate-pulse">Creating account...</span> : (
                      <>
                        <User className="w-4 h-4" />
                        <span>Create Customer Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Divider */}
              <div className="flex items-center space-x-3">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-[11px] text-gray-600 font-medium">or use demo access</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Demo Credentials Card */}
              <div className={`p-4 rounded-2xl border ${selectedPortal.border} bg-gradient-to-br ${selectedPortal.gradient}`}>
                <div className="flex items-center space-x-2 mb-3">
                  <Lock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-xs font-bold text-gray-300">Demo Credentials</p>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-500">Quick Access</span>
                </div>
                <div className="font-mono text-[11px] text-gray-500 space-y-0.5 mb-3">
                  <p>📧 {selectedPortal.demoEmail}</p>
                  <p>🔑 demo123</p>
                </div>
                <button
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-xs font-black transition-all disabled:opacity-60 flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isLoading ? 'Loading...' : `⚡ Instant Demo – ${selectedPortal.label}`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
