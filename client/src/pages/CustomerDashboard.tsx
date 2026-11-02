import React, { useState, useEffect } from 'react';
import { api, Booking, Movie } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TicketModal } from '../components/TicketModal';
import { WhatsAppPreviewModal } from '../components/WhatsAppPreviewModal';
import {
  User,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Bookmark,
  Bell,
  Settings,
  Sparkles,
  QrCode,
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface CustomerDashboardProps {
  onOpenAuraAi: () => void;
  onViewMovie: (movieId: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onOpenAuraAi,
  onViewMovie
}) => {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'bookings' | 'watchlist' | 'notifications' | 'profile'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBookingForTicket, setSelectedBookingForTicket] = useState<Booking | null>(null);
  const [selectedBookingForWhatsApp, setSelectedBookingForWhatsApp] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        const res = await api.getMyBookings({
          user_id: user?.id,
          email: user?.email,
          phone: user?.phone
        });
        setBookings(res.bookings || []);
      } catch (err) {
        console.error('Failed to load user bookings:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [user]);

  const upcomingBookings = bookings.filter(b => b.verification_status !== 'CHECKED_IN');
  const pastBookings = bookings.filter(b => b.verification_status === 'CHECKED_IN');

  return (
    <div className="space-y-8 pb-20">
      
      {/* User Header Card */}
      <div className="p-6 lg:p-8 rounded-3xl bg-[#0f172a] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-2xl shadow-xl shadow-amber-500/20">
            {user?.name ? user.name[0].toUpperCase() : 'C'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl lg:text-2xl font-black text-white">{user?.name || 'Valued Customer'}</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified Customer
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{user?.email || 'customer@cineaura.com'} • {user?.phone || '+91 98401 23456'}</p>
          </div>
        </div>

        <button
          onClick={onOpenAuraAi}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition-all"
        >
          <Sparkles className="w-4 h-4 text-purple-200" />
          <span>Ask Aura AI for Stories</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'bookings'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>My Bookings ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'watchlist'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Saved Watchlist</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'notifications'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 ${
            activeTab === 'profile'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Account Settings</span>
        </button>
      </div>

      {/* Tab Content 1: Bookings */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-44 rounded-3xl bg-white/5 animate-pulse"></div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-[#0f172a] border border-white/10 space-y-3">
              <Ticket className="w-16 h-16 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No bookings yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Discover thrilling stories in theatres today and book tickets with 5-minute atomic hold protection.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 hover:border-amber-400/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl"
                >
                  <div className="flex items-center space-x-4">
                    {booking.movie_poster && (
                      <img
                        src={booking.movie_poster}
                        alt={booking.movie_title}
                        className="w-16 h-24 rounded-2xl object-cover border border-white/10 flex-shrink-0"
                      />
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                          {booking.booking_reference}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          booking.verification_status === 'CHECKED_IN'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {booking.verification_status === 'CHECKED_IN' ? 'Checked In' : 'Active Pass'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">{booking.movie_title}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {booking.theatre_name} • {booking.screen_name}
                      </p>
                      <p className="text-xs text-amber-400 font-medium mt-1">
                        📅 {booking.show_date} | ⏰ {booking.start_time} | 💺 Seats: <strong className="text-white">{booking.seat_names}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => setSelectedBookingForTicket(booking)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Digital Ticket</span>
                    </button>

                    <button
                      onClick={() => setSelectedBookingForWhatsApp(booking)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp Confirmation</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="p-8 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4 text-center">
          <Bookmark className="w-12 h-12 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Your Cinema Watchlist</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            You've marked movies from our catalogue. Check them out when new showtimes appear in your district!
          </p>
        </div>
      )}

      {/* Tab Content 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 flex items-start space-x-3">
            <span className="text-xl">🌟</span>
            <div>
              <h4 className="text-sm font-bold text-white">Welcome to AI CineAura</h4>
              <p className="text-xs text-gray-400 mt-0.5">Explore movies tailored to your exact mood, vibe or travel mood.</p>
              <span className="text-[10px] text-gray-500 mt-1 block">Just now</span>
            </div>
          </div>
          <div className="p-4 rounded-2xl bg-[#0f172a] border border-white/10 flex items-start space-x-3">
            <span className="text-xl">🎟️</span>
            <div>
              <h4 className="text-sm font-bold text-white">Exclusive Weekend Pass</h4>
              <p className="text-xs text-gray-400 mt-0.5">Use code AURA100 on IMAX screenings for instant discounts.</p>
              <span className="text-[10px] text-gray-500 mt-1 block">1 hour ago</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Profile Settings */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 max-w-xl space-y-4">
          <h3 className="text-sm font-bold text-white">Customer Account Details</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-gray-400 block mb-1">Name</label>
              <input type="text" readOnly value={user?.name || ''} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Email</label>
              <input type="text" readOnly value={user?.email || ''} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
            <div>
              <label className="text-gray-400 block mb-1">Phone</label>
              <input type="text" readOnly value={user?.phone || ''} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            </div>
          </div>
        </div>
      )}

      {/* Digital Ticket Modal */}
      {selectedBookingForTicket && (
        <TicketModal
          isOpen={true}
          onClose={() => setSelectedBookingForTicket(null)}
          booking={selectedBookingForTicket}
          onViewWhatsApp={() => {
            const b = selectedBookingForTicket;
            setSelectedBookingForTicket(null);
            setSelectedBookingForWhatsApp(b);
          }}
          onGoToMyBookings={() => setSelectedBookingForTicket(null)}
        />
      )}

      {/* WhatsApp Modal */}
      {selectedBookingForWhatsApp && (
        <WhatsAppPreviewModal
          isOpen={true}
          onClose={() => setSelectedBookingForWhatsApp(null)}
          booking={selectedBookingForWhatsApp}
        />
      )}

    </div>
  );
};
