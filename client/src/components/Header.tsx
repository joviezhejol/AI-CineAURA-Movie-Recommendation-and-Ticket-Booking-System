import React, { useState } from 'react';
import { useDistrict } from '../context/DistrictContext';
import { useAuth } from '../context/AuthContext';
import {
  Film,
  MapPin,
  Search,
  Bell,
  User as UserIcon,
  Sparkles,
  Gift,
  Ticket,
  Bookmark,
  ChevronDown,
  ShieldAlert,
  LogOut,
  Building2,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
  onOpenAuraAi: () => void;
  onOpenLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenAuraAi,
  onOpenLogin
}) => {
  const { districtId, districtName, setDistrict, availableDistricts } = useDistrict();
  const { user, isCustomer, isManager, isEmployee, switchRole, logout } = useAuth();
  
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'theatres', label: 'Theatres', icon: Building2 },
    { id: 'aura-ai', label: 'Aura AI', icon: Sparkles, isAi: true },
    { id: 'offers', label: 'Offers', icon: Gift },
    { id: 'my-bookings', label: 'My Bookings', icon: Ticket },
    { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0a0e17]/90 backdrop-blur-md border-b border-white/10 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Left: Brand & Tagline */}
        <div className="flex items-center space-x-8">
          <div
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            {/* Custom Logo Mark */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-[2px] shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">
              <div className="w-full h-full bg-[#0a0e17] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <span className="text-xl font-black bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                  A
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent"></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-white font-sans">
                  AI CineAura
                </span>
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-medium tracking-wide">
                Stories That Made for You.
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'aura-ai') {
                      onOpenAuraAi();
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`w-4 h-4 ${
                        item.isAi ? 'text-purple-400 animate-pulse' : ''
                      }`}
                    />
                  )}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right: Location Selector, Role Switcher & Profile */}
        <div className="flex items-center space-x-3">
          
          {/* Location Selector (Chennai, Chengalpattu, Kanchipuram) */}
          <div className="relative">
            <button
              onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#121927] hover:bg-[#182235] border border-white/10 text-xs font-semibold text-gray-200 transition-all shadow-inner"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{districtName}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isDistrictDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#0f172a] border border-white/10 shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Select District (Tamil Nadu)
                </div>
                {availableDistricts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDistrict(d.id);
                      setIsDistrictDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-white/5 transition-all ${
                      districtId === d.id ? 'text-amber-400 font-bold bg-amber-400/10' : 'text-gray-300'
                    }`}
                  >
                    <span>{d.name}</span>
                    {districtId === d.id && <CheckCircle className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role Portal Indicator / Switcher Pill */}
          <button
            onClick={() => setIsRoleModalOpen(true)}
            className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isManager
                ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                : isEmployee
                ? 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="capitalize">{user?.role || 'Customer'} Portal</span>
          </button>

          {/* Quick Dashboard shortcut if Manager or Employee */}
          {isManager && (
            <button
              onClick={() => onNavigate('manager-dashboard')}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-purple-600/20"
            >
              Manager Dashboard
            </button>
          )}

          {isEmployee && (
            <button
              onClick={() => onNavigate('employee-dashboard')}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/20"
            >
              Gate Scanner
            </button>
          )}

          {/* Login button for guests */}
          {onOpenLogin && !isManager && !isEmployee && (
            <button
              onClick={onOpenLogin}
              className="hidden sm:flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[#0a0e17]"></span>
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                  <span className="text-[11px] text-amber-400 cursor-pointer">Mark all read</span>
                </div>
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <p className="text-xs font-semibold text-white">🌟 Welcome to AI CineAura</p>
                    <p className="text-[11px] text-gray-400 mt-1">Discover your next movie by mood, vibe or travel plan with Aura AI.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs font-semibold text-amber-300">🎟️ Weekend IMAX Pass</p>
                    <p className="text-[11px] text-gray-300 mt-1">Use coupon AURA100 at checkout for ₹100 off on IMAX tickets.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile & Avatar */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center space-x-2 p-1 pl-1.5 pr-2 rounded-full bg-[#141b2c] hover:bg-[#1a233a] border border-white/10 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-[#0a0e17] font-bold text-xs ring-2 ring-white/10">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0f172a] border border-white/10 shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">{user?.name || 'Customer'}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email || 'customer@cineaura.com'}</p>
                  <div className="mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-400/10 text-amber-400">
                    {user?.role || 'customer'}
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      onNavigate('customer-dashboard');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center space-x-2"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>My Profile & Bookings</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsRoleModalOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 flex items-center space-x-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                    <span>Switch Portal / Role</span>
                  </button>
                </div>

                <div className="border-t border-white/10 pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-3 pt-3 border-t border-white/10 space-y-1">
          {navLinks.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setMobileMenuOpen(false);
                if (item.id === 'aura-ai') onOpenAuraAi();
                else onNavigate(item.id);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-white/5 flex items-center space-x-2"
            >
              {item.icon && <item.icon className="w-4 h-4 text-amber-400" />}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsRoleModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 text-xs text-purple-300 font-bold"
            >
              Switch Role / Portal (Customer, Manager, Employee)
            </button>
          </div>
        </div>
      )}

      {/* 1-Click Role Switcher Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsRoleModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-purple-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Three CineAura Portals</h3>
              <p className="text-xs text-gray-400 mt-1">
                Switch instantly between the three authenticated roles to test real full-stack capabilities.
              </p>
            </div>

            <div className="space-y-3">
              {/* Role 1: Customer */}
              <div
                onClick={async () => {
                  await switchRole('customer');
                  setIsRoleModalOpen(false);
                  onNavigate('home');
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isCustomer
                    ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      👤
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Customer Portal</h4>
                      <p className="text-[11px] text-gray-400">Search, Aura AI, Seat hold, Pay & Digital QR</p>
                    </div>
                  </div>
                  {isCustomer && <span className="text-[11px] font-bold text-amber-400">ACTIVE</span>}
                </div>
              </div>

              {/* Role 2: Theatre Manager */}
              <div
                onClick={async () => {
                  await switchRole('manager');
                  setIsRoleModalOpen(false);
                  onNavigate('manager-dashboard');
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isManager
                    ? 'bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      📊
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Theatre Manager</h4>
                      <p className="text-[11px] text-gray-400">Analytics, Show schedules, Block/Release seats</p>
                    </div>
                  </div>
                  {isManager && <span className="text-[11px] font-bold text-purple-400">ACTIVE</span>}
                </div>
              </div>

              {/* Role 3: Theatre Employee */}
              <div
                onClick={async () => {
                  await switchRole('employee');
                  setIsRoleModalOpen(false);
                  onNavigate('employee-dashboard');
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isEmployee
                    ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/50'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      📱
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Theatre Employee</h4>
                      <p className="text-[11px] text-gray-400">Gate QR verification scanner & Show status</p>
                    </div>
                  </div>
                  {isEmployee && <span className="text-[11px] font-bold text-blue-400">ACTIVE</span>}
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
