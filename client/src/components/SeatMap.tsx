import React, { useState, useEffect } from 'react';
import { api, Seat, Show } from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  Lock,
  Clock,
  AlertCircle,
  Users,
  Heart,
  User,
  ShieldAlert,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface SeatMapProps {
  show: Show;
  sessionId: string;
  userId?: string | null;
  onSeatHoldSuccess: (selectedSeats: Seat[], holdExpiresAt: number, seatType: string) => void;
  onHoldExpired: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  show,
  sessionId,
  userId,
  onSeatHoldSuccess,
  onHoldExpired
}) => {
  const { socket, joinShowRoom, leaveShowRoom } = useSocket();

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [seatType, setSeatType] = useState<'SINGLE' | 'COUPLE' | 'FRIENDS' | 'FAMILY'>('SINGLE');
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // Load seats from server
  const loadSeats = async () => {
    try {
      setIsLoading(true);
      const res = await api.getShowSeats(show.id, sessionId);
      setSeats(res.seats || []);

      // If any seats are already held by this session
      const myHeld = (res.seats || []).filter(s => s.status === 'SELECTED' && s.isCurrentSession);
      if (myHeld.length > 0) {
        setSelectedSeatIds(myHeld.map(s => s.id));
        if (myHeld[0].expiresAt) {
          setHoldExpiresAt(myHeld[0].expiresAt);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load seats');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and WebSocket subscription
  useEffect(() => {
    loadSeats();
    joinShowRoom(show.id);

    if (socket) {
      const handleSeatsUpdated = (data: any) => {
        if (data.showId === show.id) {
          // Refresh seat map when other users hold/book/block
          loadSeats();
        }
      };

      const handleSweep = () => {
        loadSeats();
      };

      socket.on('seats_updated', handleSeatsUpdated);
      socket.on('holds_expired_sweep', handleSweep);

      return () => {
        socket.off('seats_updated', handleSeatsUpdated);
        socket.off('holds_expired_sweep', handleSweep);
        leaveShowRoom(show.id);
      };
    }
  }, [show.id, socket]);

  // 5-Minute Countdown Timer
  useEffect(() => {
    if (!holdExpiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diffSecs = Math.max(0, Math.floor((holdExpiresAt - now) / 1000));
      setRemainingSeconds(diffSecs);

      if (diffSecs <= 0) {
        setHoldExpiresAt(null);
        setSelectedSeatIds([]);
        onHoldExpired();
        loadSeats();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [holdExpiresAt]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Seat Click Handler
  const handleSeatClick = async (seat: Seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'BLOCKED' || (seat.status === 'HELD' && !seat.isCurrentSession)) {
      return;
    }

    setErrorMessage(null);
    let targetIds = [...selectedSeatIds];

    // Determine seats to toggle
    let seatsToToggle = [seat.id];
    if (seatType === 'COUPLE' && seat.couple_pair_id) {
      seatsToToggle = [seat.id, seat.couple_pair_id];
    }

    const isAlreadySelected = seatsToToggle.every(id => targetIds.includes(id));

    if (isAlreadySelected) {
      // Unselect
      targetIds = targetIds.filter(id => !seatsToToggle.includes(id));
    } else {
      // Check seat limit based on type
      if (seatType === 'SINGLE') {
        targetIds = [seat.id]; // 1 seat for single
      } else if (seatType === 'COUPLE') {
        targetIds = seatsToToggle; // 2 linked seats
      } else {
        // Friends / Family: max 8 seats
        if (targetIds.length + seatsToToggle.length > 8) {
          setErrorMessage('Maximum 8 seats can be selected per reservation.');
          return;
        }
        targetIds = Array.from(new Set([...targetIds, ...seatsToToggle]));
      }
    }

    // Call atomic hold on the backend
    try {
      setIsHolding(true);
      if (targetIds.length === 0) {
        await api.releaseSeats({ showId: show.id, sessionId });
        setSelectedSeatIds([]);
        setHoldExpiresAt(null);
        loadSeats();
      } else {
        const res = await api.holdSeats({
          showId: show.id,
          seatIds: targetIds,
          sessionId,
          userId
        });

        if (res.success && res.expiresAt) {
          setSelectedSeatIds(targetIds);
          setHoldExpiresAt(res.expiresAt);
          const heldSeatObjects = seats.filter(s => targetIds.includes(s.id));
          onSeatHoldSuccess(heldSeatObjects, res.expiresAt, seatType);
          loadSeats();
        } else {
          setErrorMessage(res.error || 'Failed to reserve seat. It may have just been locked by another customer.');
          loadSeats();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Hold failed due to network error');
    } finally {
      setIsHolding(false);
    }
  };

  // Group seats by row (A to G)
  const rows = Array.from(new Set(seats.map(s => s.row_label))).sort();

  // Price calculation
  const selectedSeats = seats.filter(s => selectedSeatIds.includes(s.id));
  const subtotal = selectedSeats.reduce((sum, s) => sum + (s.base_price || show.ticket_price || 190), 0);

  return (
    <div className="rounded-3xl bg-[#0f172a] border border-white/10 p-6 lg:p-8 shadow-2xl relative">
      
      {/* 5-Minute Hold Countdown Banner */}
      {holdExpiresAt && remainingSeconds > 0 && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between border transition-all ${
          remainingSeconds < 60
            ? 'bg-rose-950/60 border-rose-500/50 text-rose-300 animate-pulse'
            : 'bg-amber-950/60 border-amber-500/50 text-amber-300'
        }`}>
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 flex-shrink-0 animate-spin" style={{ animationDuration: '10s' }} />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider">
                Seats Locked for Your Reservation
              </p>
              <p className="text-[11px] text-gray-300">
                Complete your payment before time expires. These seats are protected from other buyers.
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black font-mono tracking-wider">
              {formatTime(remainingSeconds)}
            </span>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Seat Type Selector Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Select Seat Category</span>
          </h3>
          <p className="text-xs text-gray-400">
            {seatType === 'SINGLE' && 'Choose 1 individual seat'}
            {seatType === 'COUPLE' && 'Select linked couple pair (Row G)'}
            {seatType === 'FRIENDS' && 'Select adjacent seats for your friends group'}
            {seatType === 'FAMILY' && 'Select family recliner row seats (Rows A & B)'}
          </p>
        </div>

        <div className="flex items-center p-1 rounded-2xl bg-[#090d16] border border-white/10 space-x-1">
          <button
            onClick={() => setSeatType('SINGLE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              seatType === 'SINGLE' ? 'bg-amber-500 text-black font-bold shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Single</span>
          </button>

          <button
            onClick={() => setSeatType('COUPLE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              seatType === 'COUPLE' ? 'bg-pink-500 text-white font-bold shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Couple (2)</span>
          </button>

          <button
            onClick={() => setSeatType('FRIENDS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              seatType === 'FRIENDS' ? 'bg-purple-600 text-white font-bold shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Friends</span>
          </button>

          <button
            onClick={() => setSeatType('FAMILY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              seatType === 'FAMILY' ? 'bg-emerald-600 text-white font-bold shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Family</span>
          </button>
        </div>
      </div>

      {/* Screen Curved Header */}
      <div className="mb-12 text-center">
        <div className="relative w-3/4 max-w-lg mx-auto">
          {/* Curved glowing bar */}
          <div className="h-2 rounded-t-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_25px_rgba(56,189,248,0.6)]"></div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mt-3">
            All Eyes This Way • Cinema Screen
          </p>
        </div>
      </div>

      {/* Seat Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <p className="text-xs text-gray-400">Loading live real-time seat availability...</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-x-auto pb-4">
          {rows.map((rowLabel) => {
            const rowSeats = seats.filter(s => s.row_label === rowLabel);
            return (
              <div key={rowLabel} className="flex items-center justify-center space-x-2 min-w-[500px]">
                {/* Row label */}
                <span className="w-6 text-center text-xs font-bold text-gray-500">
                  {rowLabel}
                </span>

                {/* Seat buttons in this row */}
                <div className="flex items-center space-x-2">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.id);
                    const isHeldByOther = seat.status === 'HELD' && !seat.isCurrentSession;
                    const isBooked = seat.status === 'BOOKED';
                    const isBlocked = seat.status === 'BLOCKED';

                    let seatBg = 'bg-[#182238] border-white/10 hover:border-amber-400 text-gray-300';
                    if (isSelected) {
                      seatBg = 'bg-amber-400 text-black border-amber-300 font-bold shadow-lg shadow-amber-400/30 scale-105';
                    } else if (isHeldByOther) {
                      seatBg = 'bg-amber-950/60 border-amber-500/40 text-amber-400 cursor-not-allowed opacity-75';
                    } else if (isBooked) {
                      seatBg = 'bg-gray-800/50 border-gray-700 text-gray-600 cursor-not-allowed';
                    } else if (isBlocked) {
                      seatBg = 'bg-rose-950/40 border-rose-600/40 text-rose-500 cursor-not-allowed';
                    }

                    return (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat)}
                        disabled={isBooked || isBlocked || isHeldByOther || isHolding}
                        title={`Seat ${seat.seat_number} - ₹${seat.base_price} (${seat.status})`}
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl border text-[11px] font-semibold flex items-center justify-center transition-all relative ${seatBg}`}
                      >
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-black" />
                        ) : isHeldByOther ? (
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <span>{seat.seat_number}</span>
                        )}

                        {/* Couple seat link indicator */}
                        {seat.seat_type === 'COUPLE' && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-pink-500"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <span className="w-6 text-center text-xs font-bold text-gray-500">
                  {rowLabel}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-md bg-[#182238] border border-white/10"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-md bg-amber-400 border border-amber-300"></div>
          <span className="text-white font-bold">Selected</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-md bg-amber-950/80 border border-amber-500/50 flex items-center justify-center">
            <Lock className="w-2.5 h-2.5 text-amber-400" />
          </div>
          <span>Held (5m Lock)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-md bg-gray-800 border border-gray-700"></div>
          <span>Booked</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 rounded-md bg-rose-950 border border-rose-600"></div>
          <span>Manager Blocked</span>
        </div>
      </div>

      {/* Selected Seats summary & Total */}
      {selectedSeats.length > 0 && (
        <div className="mt-6 p-4 rounded-2xl bg-[#090d16] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Selected Seats ({selectedSeats.length})
            </p>
            <p className="text-sm font-bold text-white mt-0.5">
              {selectedSeats.map(s => s.seat_number).sort().join(', ')} ({seatType})
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Subtotal</p>
            <p className="text-xl font-black text-amber-400">₹{subtotal.toFixed(2)}</p>
          </div>
        </div>
      )}

    </div>
  );
};
