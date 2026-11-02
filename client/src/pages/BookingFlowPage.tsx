import React, { useState, useEffect } from 'react';
import { api, Show, Seat, Booking } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SeatMap } from '../components/SeatMap';
import { PaymentModal } from '../components/PaymentModal';
import { TicketModal } from '../components/TicketModal';
import { WhatsAppPreviewModal } from '../components/WhatsAppPreviewModal';
import {
  ChevronLeft,
  Calendar,
  Clock,
  Building2,
  Film,
  Ticket,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface BookingFlowPageProps {
  initialShowId?: string;
  onBack: () => void;
  onGoToMyBookings: () => void;
}

export const BookingFlowPage: React.FC<BookingFlowPageProps> = ({
  initialShowId,
  onBack,
  onGoToMyBookings
}) => {
  const { user } = useAuth();
  
  // Session ID for atomic locking
  const [sessionId] = useState(() => {
    let s = localStorage.getItem('cineaura_session_id');
    if (!s) {
      s = `sess_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
      localStorage.setItem('cineaura_session_id', s);
    }
    return s;
  });

  const [show, setShow] = useState<Show | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [selectedSeatType, setSelectedSeatType] = useState<string>('SINGLE');

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  useEffect(() => {
    const fetchShow = async () => {
      try {
        setIsLoading(true);
        if (!initialShowId) {
          // If no specific show passed, fetch the first available show
          const showsRes = await api.getShows();
          if (showsRes.shows && showsRes.shows.length > 0) {
            const detailRes = await api.getShowById(showsRes.shows[0].id);
            setShow(detailRes.show);
          }
        } else {
          const detailRes = await api.getShowById(initialShowId);
          setShow(detailRes.show);
        }
      } catch (err) {
        console.error('Failed to load show for booking:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShow();
  }, [initialShowId]);

  const handleSeatHoldSuccess = (seats: Seat[], expiresAt: number, seatType: string) => {
    setSelectedSeats(seats);
    setHoldExpiresAt(expiresAt);
    setSelectedSeatType(seatType);
  };

  const handleHoldExpired = () => {
    setSelectedSeats([]);
    setHoldExpiresAt(null);
    setIsPaymentOpen(false);
  };

  const handleBookingSuccess = (booking: Booking, whatsappLog: any) => {
    setIsPaymentOpen(false);
    setConfirmedBooking(booking);
    setIsTicketOpen(true);
  };

  if (isLoading || !show) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-gray-400">Initializing cinema seat map and atomic hold system...</p>
      </div>
    );
  }

  const subtotal = selectedSeats.reduce((sum, s) => sum + (s.base_price || show.ticket_price || 190.0), 0);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center space-x-2 text-xs font-semibold text-gray-400">
          <span className="text-amber-400 font-bold">1. Seat Selection</span>
          <span>→</span>
          <span className={selectedSeats.length > 0 ? 'text-amber-400 font-bold' : ''}>2. 5-Min Lock</span>
          <span>→</span>
          <span>3. Checkout</span>
          <span>→</span>
          <span>4. Digital Pass & WhatsApp</span>
        </div>
      </div>

      {/* Show Overview Banner */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <img
            src={show.movie_poster}
            alt={show.movie_title}
            className="w-16 h-24 rounded-2xl object-cover border border-white/15 flex-shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {show.experience}
              </span>
              <span className="text-xs text-gray-400">{show.movie_language}</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              {show.movie_title}
            </h2>
            <p className="text-xs text-gray-400 flex items-center space-x-2 mt-1">
              <span>{show.theatre_name}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">{show.screen_name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs text-gray-300">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Show Date</p>
              <p className="font-bold text-white">{show.show_date}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Showtime</p>
              <p className="font-bold text-white">{show.start_time}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Seat Map */}
      <SeatMap
        show={show}
        sessionId={sessionId}
        userId={user?.id}
        onSeatHoldSuccess={handleSeatHoldSuccess}
        onHoldExpired={handleHoldExpired}
      />

      {/* Bottom Sticky Action Bar when seats are held */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#0a0e17]/95 backdrop-blur-md border-t border-amber-500/30 p-4 shadow-2xl">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Seat Held' : 'Seats Held'} ({selectedSeatType})
                </p>
                <p className="text-sm font-bold text-white">
                  {selectedSeats.map(s => s.seat_number).sort().join(', ')} • ₹{subtotal.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsPaymentOpen(true)}
              className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentOpen && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          show={show}
          selectedSeats={selectedSeats}
          seatType={selectedSeatType}
          sessionId={sessionId}
          userId={user?.id}
          userName={user?.name}
          userEmail={user?.email}
          userPhone={user?.phone}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Digital Ticket Pass Modal */}
      {isTicketOpen && confirmedBooking && (
        <TicketModal
          isOpen={isTicketOpen}
          onClose={() => setIsTicketOpen(false)}
          booking={confirmedBooking}
          onViewWhatsApp={() => setIsWhatsAppOpen(true)}
          onGoToMyBookings={onGoToMyBookings}
        />
      )}

      {/* WhatsApp Message Preview Modal */}
      {isWhatsAppOpen && confirmedBooking && (
        <WhatsAppPreviewModal
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
          booking={confirmedBooking}
        />
      )}

    </div>
  );
};
