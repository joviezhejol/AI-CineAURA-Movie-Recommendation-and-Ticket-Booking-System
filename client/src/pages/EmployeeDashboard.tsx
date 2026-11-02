import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { QrScannerModal } from '../components/QrScannerModal';
import {
  ScanLine,
  Search,
  CheckCircle2,
  Clock,
  Ticket,
  Film,
  Building2,
  AlertTriangle,
  RefreshCw,
  Users
} from 'lucide-react';

export const EmployeeDashboard: React.FC = () => {
  const [todayShows, setTodayShows] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Seat status inspector for a show
  const [selectedShowForStatus, setSelectedShowForStatus] = useState<string>('');
  const [showSeats, setShowSeats] = useState<any[]>([]);

  const loadShows = async () => {
    try {
      setIsLoading(true);
      const res = await api.getEmployeeTodayShows();
      setTodayShows(res.shows || []);
      if (res.shows && res.shows.length > 0 && !selectedShowForStatus) {
        setSelectedShowForStatus(res.shows[0].id);
      }
    } catch (err) {
      console.error('Failed to load today shows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShows();
  }, []);

  useEffect(() => {
    if (selectedShowForStatus) {
      api.getShowSeats(selectedShowForStatus).then(res => {
        setShowSeats(res.seats || []);
      });
    }
  }, [selectedShowForStatus]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await api.searchEmployeeBookings(searchQuery);
      setSearchResults(res.bookings || []);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-blue-950/60 to-[#0f172a] border border-blue-500/30 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">📱</span>
            <h1 className="text-2xl font-black text-white">Box Office & Gate Attendant Portal</h1>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Staff Access Only
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Validate digital QR tickets, verify admissions, search bookings, and check real-time auditorium seat status.
          </p>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-extrabold text-xs shadow-xl shadow-blue-500/25 transition-all flex items-center space-x-2 flex-shrink-0"
        >
          <ScanLine className="w-4 h-4" />
          <span>Launch QR Scanner</span>
        </button>
      </div>

      {/* Booking Search Tool */}
      <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center space-x-2">
          <Search className="w-4 h-4 text-blue-400" />
          <span>Search Bookings by Customer Phone, Name or Reference</span>
        </h3>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search booking ref (e.g. CINE-...), customer phone, or name..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#090d16] border border-white/15 text-xs text-white focus:outline-none focus:border-blue-400"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
          >
            Search
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="space-y-2 pt-2">
            {searchResults.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-[#090d16] border border-white/10 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-amber-400">{b.booking_reference}</span> •{' '}
                  <strong className="text-white">{b.customer_name}</strong> ({b.customer_phone})
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {b.movie_title} • {b.screen_name} • Seats: <span className="text-white font-bold">{b.seat_names}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsScannerOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-bold text-xs"
                >
                  Verify Ticket
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Shows & Auditorium Seat Occupancy Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Shows */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Today's Active Screenings</span>
          </h3>

          <div className="space-y-3">
            {todayShows.map((s) => (
              <div
                key={s.id}
                onClick={() => setSelectedShowForStatus(s.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                  selectedShowForStatus === s.id
                    ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/50'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{s.movie_title}</h4>
                  <p className="text-[11px] text-gray-400">
                    {s.theatre_name} • {s.screen_name}
                  </p>
                  <p className="text-[10px] text-amber-400 font-medium mt-0.5">
                    ⏰ {s.start_time} - {s.end_time}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-white">{s.booked_seats_count || 0}</span>
                  <p className="text-[10px] text-gray-400">Booked Seats</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Seat Status Inspector */}
        <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Auditorium Seat Status Check</span>
          </h3>

          <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10">
            <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
              {showSeats.map((seat) => {
                let bg = 'bg-[#182238] text-gray-400';
                if (seat.status === 'BOOKED') bg = 'bg-emerald-600 text-white font-bold';
                else if (seat.status === 'HELD') bg = 'bg-amber-600 text-black font-bold';
                else if (seat.status === 'BLOCKED') bg = 'bg-rose-900 text-rose-300 font-bold';

                return (
                  <div
                    key={seat.id}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold flex items-center justify-center ${bg}`}
                    title={`${seat.seat_number} - ${seat.status}`}
                  >
                    {seat.seat_number}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center space-x-3 text-[10px] text-gray-400 pt-4">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600"></span>
                <span>Booked</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-600"></span>
                <span>Held</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-900"></span>
                <span>Blocked</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded bg-[#182238]"></span>
                <span>Available</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={() => loadShows()}
      />

    </div>
  );
};
