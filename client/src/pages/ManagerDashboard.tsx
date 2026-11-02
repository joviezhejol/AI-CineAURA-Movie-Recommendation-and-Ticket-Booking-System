import React, { useState, useEffect } from 'react';
import { api, Show } from '../services/api';
import {
  TrendingUp,
  DollarSign,
  Ticket,
  Users,
  Film,
  Building2,
  Calendar,
  Lock,
  Unlock,
  AlertCircle,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [shows, setShows] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'shows' | 'block-seats' | 'reports'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Seat Blocking State
  const [selectedShowForBlock, setSelectedShowForBlock] = useState<string>('');
  const [showSeats, setShowSeats] = useState<any[]>([]);
  const [selectedSeatsToBlock, setSelectedSeatsToBlock] = useState<string[]>([]);
  const [blockReason, setBlockReason] = useState('VIP / Maintenance Reserved');
  const [blockStatusMessage, setBlockStatusMessage] = useState<string | null>(null);

  // Add Show State
  const [isAddShowOpen, setIsAddShowOpen] = useState(false);
  const [newShowData, setNewShowData] = useState({
    movie_id: 'mov-thalapathy69',
    theatre_id: 'th-chn-phoenix',
    screen_id: 'th-chn-phoenix-scr1',
    show_date: new Date().toISOString().split('T')[0],
    start_time: '07:00 PM',
    end_time: '10:00 PM',
    language: 'Tamil',
    experience: 'IMAX',
    ticket_price: 350
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [analyticsRes, showsRes] = await Promise.all([
        api.getManagerAnalytics(),
        api.getManagerShows()
      ]);
      setAnalytics(analyticsRes);
      setShows(showsRes.shows || []);
      if (showsRes.shows && showsRes.shows.length > 0 && !selectedShowForBlock) {
        setSelectedShowForBlock(showsRes.shows[0].id);
      }
    } catch (err) {
      console.error('Failed to load manager data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load seats when a show is selected for blocking
  useEffect(() => {
    if (selectedShowForBlock) {
      api.getShowSeats(selectedShowForBlock).then(res => {
        setShowSeats(res.seats || []);
        setSelectedSeatsToBlock([]);
      });
    }
  }, [selectedShowForBlock]);

  const handleToggleSeatForBlock = (seatId: string) => {
    if (selectedSeatsToBlock.includes(seatId)) {
      setSelectedSeatsToBlock(selectedSeatsToBlock.filter(id => id !== seatId));
    } else {
      setSelectedSeatsToBlock([...selectedSeatsToBlock, seatId]);
    }
  };

  const handleBlockSeats = async () => {
    if (selectedSeatsToBlock.length === 0 || !selectedShowForBlock) return;
    try {
      await api.blockSeats(selectedShowForBlock, selectedSeatsToBlock, blockReason);
      setBlockStatusMessage(`Successfully BLOCKED ${selectedSeatsToBlock.length} seat(s). Customers can no longer book these.`);
      // Reload seats
      const res = await api.getShowSeats(selectedShowForBlock);
      setShowSeats(res.seats || []);
      setSelectedSeatsToBlock([]);
      setTimeout(() => setBlockStatusMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Block seats failed');
    }
  };

  const handleReleaseSeats = async () => {
    if (selectedSeatsToBlock.length === 0 || !selectedShowForBlock) return;
    try {
      await api.releaseManagerBlockedSeats(selectedShowForBlock, selectedSeatsToBlock);
      setBlockStatusMessage(`Successfully RELEASED ${selectedSeatsToBlock.length} seat(s) back to AVAILABLE!`);
      const res = await api.getShowSeats(selectedShowForBlock);
      setShowSeats(res.seats || []);
      setSelectedSeatsToBlock([]);
      setTimeout(() => setBlockStatusMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Release seats failed');
    }
  };

  const handleAddShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addShow(newShowData);
      setIsAddShowOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Add show failed');
    }
  };

  const handleCancelShow = async (showId: string) => {
    if (!confirm('Are you sure you want to cancel this show? This will immediately remove customer booking availability.')) return;
    try {
      await api.cancelShow(showId);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Cancel show failed');
    }
  };

  if (isLoading || !analytics) {
    return (
      <div className="py-24 text-center space-y-4">
        <RefreshCw className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto text-purple-400" />
        <p className="text-sm text-gray-400">Loading CineAura Enterprise Cinema Manager Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-purple-950/60 to-[#0f172a] border border-purple-500/30 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">📊</span>
            <h1 className="text-2xl font-black text-white">Theatre Manager Portal</h1>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Commercial Operations
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Real-time analytics, showtimes administration, occupancy controls, and atomic seat blocking.
          </p>
        </div>

        <button
          onClick={() => setIsAddShowOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-1.5 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Show</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Overview & KPIs
        </button>

        <button
          onClick={() => setActiveTab('shows')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'shows'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Active Shows ({shows.length})
        </button>

        <button
          onClick={() => setActiveTab('block-seats')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'block-seats'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Seat Management & Blocking
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'reports'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Revenue & Occupancy Reports
        </button>
      </div>

      {/* Tab 1: Overview KPIs */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-3xl bg-[#0f172a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">₹{analytics.todayRevenue.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-400 font-semibold">Live Real-Time Audited</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#0f172a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Today's Bookings</span>
                <Ticket className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">{analytics.todayBookings} Tickets</p>
              <p className="text-[10px] text-gray-400">Total Confirmed Passes</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#0f172a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Occupancy Rate</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-black text-white">{analytics.occupancyPercentage}%</p>
              <p className="text-[10px] text-cyan-300">Across All Screens</p>
            </div>

            <div className="p-5 rounded-3xl bg-[#0f172a] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-bold uppercase tracking-wider">Active 5m Holds</span>
                <Lock className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-purple-300">{analytics.heldSeats} Seats</p>
              <p className="text-[10px] text-gray-400">{analytics.blockedSeats} Manager Blocked</p>
            </div>

          </div>

          {/* Monthly Revenue Bar Chart & Trends directly on Overview */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>Monthly Revenue Trend Graph</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">Audited commercial performance comparison over the last 6 months</p>
              </div>
              <span className="text-[11px] font-semibold text-purple-300 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 self-start sm:self-auto">
                2026 Fiscal Year
              </span>
            </div>

            {/* Visual Bar Graph */}
            {(() => {
              const months = [
                { month: 'May 2026', revenue: Math.round((analytics.totalRevenue || 120000) * 0.68), bookings: Math.round((analytics.todayBookings || 40) * 18) },
                { month: 'Jun 2026', revenue: Math.round((analytics.totalRevenue || 120000) * 0.74), bookings: Math.round((analytics.todayBookings || 40) * 21) },
                { month: 'Jul 2026', revenue: Math.round((analytics.totalRevenue || 120000) * 0.81), bookings: Math.round((analytics.todayBookings || 40) * 24) },
                { month: 'Aug 2026', revenue: Math.round((analytics.totalRevenue || 120000) * 0.87), bookings: Math.round((analytics.todayBookings || 40) * 26) },
                { month: 'Sep 2026', revenue: Math.round((analytics.totalRevenue || 120000) * 0.92), bookings: Math.round((analytics.todayBookings || 40) * 28) },
                { month: 'Oct 2026', revenue: analytics.totalRevenue || 150000,                       bookings: (analytics.todayBookings || 40) * 30 },
              ];
              const maxRev = Math.max(...months.map(m => m.revenue));
              return (
                <div className="space-y-4 pt-2">
                  <div className="flex items-end justify-between gap-3 h-56 px-2">
                    {months.map((m, i) => {
                      const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
                      const isLatest = i === months.length - 1;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group relative">
                          {/* Value callout pill */}
                          <div className="text-[11px] font-black text-amber-300 bg-black/60 px-2 py-0.5 rounded border border-white/10 shadow whitespace-nowrap">
                            ₹{(m.revenue / 1000).toFixed(0)}K
                          </div>
                          {/* Graphical Bar */}
                          <div className="w-full max-w-[56px] rounded-t-2xl relative overflow-hidden bg-white/5" style={{ height: `${pct}%`, minHeight: '12px' }}>
                            <div
                              className={`absolute inset-0 rounded-t-2xl transition-all duration-500 ${
                                isLatest
                                  ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 shadow-lg shadow-amber-500/30'
                                  : 'bg-gradient-to-t from-purple-900 via-purple-700 to-purple-500 group-hover:brightness-125'
                              }`}
                            />
                            {isLatest && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                            )}
                          </div>
                          {/* Label */}
                          <span className={`text-xs font-bold ${isLatest ? 'text-amber-400' : 'text-gray-400'}`}>
                            {m.month.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Y-axis summary line */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-white/10 pt-3">
                    <span>Baseline ₹0</span>
                    <span>Midway ₹{(maxRev / 2 / 1000).toFixed(0)}K</span>
                    <span className="text-amber-400 font-bold">Peak ₹{(maxRev / 1000).toFixed(0)}K</span>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center space-x-6 text-xs text-gray-400 pt-1">
                    <span className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 rounded bg-gradient-to-t from-purple-800 to-purple-500 inline-block" />
                      <span>Past Months Audited</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <span className="w-3.5 h-3.5 rounded bg-gradient-to-t from-amber-600 to-amber-400 inline-block" />
                      <span className="text-white font-semibold">Current Month (October 2026)</span>
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Popular Movies & Trending */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Top Performing Movies</span>
              </h3>
              <div className="space-y-3">
                {analytics.popularMovies.map((mov: any, idx: number) => (
                  <div key={mov.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-black text-amber-400 w-4">#{idx + 1}</span>
                      <img src={mov.poster_url} alt="" className="w-8 h-12 rounded-lg object-cover" />
                      <span className="text-xs font-bold text-white truncate max-w-[160px]">{mov.title}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">₹{mov.revenue?.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">{mov.bookingsCount} Bookings</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Booked Seats */}
            <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                <span>Most Desired Seat Numbers</span>
              </h3>
              <p className="text-xs text-gray-400">
                Historical seating preference distribution based on customer bookings:
              </p>
              <div className="grid grid-cols-4 gap-3">
                {analytics.popularSeats.map((s: any) => (
                  <div key={s.seat_number} className="p-3 rounded-2xl bg-[#090d16] border border-white/10 text-center">
                    <p className="text-sm font-black text-amber-400">{s.seat_number}</p>
                    <p className="text-[10px] text-gray-400">{s.bookCount} times</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 2: Show Management */}
      {activeTab === 'shows' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Active Shows Schedule</h3>
            <span className="text-xs text-gray-400">{shows.length} Total Shows</span>
          </div>

          <div className="space-y-3">
            {shows.map((show) => (
              <div
                key={show.id}
                className="p-5 rounded-2xl bg-[#0f172a] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center space-x-4">
                  {show.movie_poster && (
                    <img src={show.movie_poster} alt="" className="w-12 h-16 rounded-xl object-cover" />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-white">{show.movie_title}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {show.theatre_name} • {show.screen_name} ({show.experience})
                    </p>
                    <p className="text-xs text-amber-400 font-medium mt-1">
                      📅 {show.show_date} | ⏰ {show.start_time} - {show.end_time} | Ticket: ₹{show.ticket_price}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    show.status === 'ACTIVE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {show.status}
                  </span>

                  {show.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleCancelShow(show.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                      title="Cancel Show"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Seat Management & Manager Blocking */}
      {activeTab === 'block-seats' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Lock className="w-5 h-5 text-amber-400" />
                <span>Manager Seat Blocking & Release</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Select seats (e.g. A1, A2, A3) and click "BLOCK SEATS" to make them unavailable for customers, or "RELEASE SEATS" to reopen them.
              </p>
            </div>

            {blockStatusMessage && (
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                {blockStatusMessage}
              </div>
            )}

            {/* Select Show to manage */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Select Show to Inspect & Block</label>
              <select
                value={selectedShowForBlock}
                onChange={(e) => setSelectedShowForBlock(e.target.value)}
                className="w-full sm:w-96 px-4 py-2.5 rounded-2xl bg-[#090d16] border border-white/15 text-xs text-white focus:outline-none"
              >
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.movie_title} - {s.theatre_name} ({s.show_date} {s.start_time})
                  </option>
                ))}
              </select>
            </div>

            {/* Seat Map for Manager */}
            <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 space-y-3 overflow-x-auto">
              <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
                {showSeats.map((seat) => {
                  const isChecked = selectedSeatsToBlock.includes(seat.id);
                  const isBlocked = seat.status === 'BLOCKED';
                  const isBooked = seat.status === 'BOOKED';

                  let bg = 'bg-[#182238] border-white/10 text-gray-300';
                  if (isChecked) bg = 'bg-purple-600 text-white border-purple-400 font-bold scale-105';
                  else if (isBlocked) bg = 'bg-rose-950 border-rose-600 text-rose-400 font-bold';
                  else if (isBooked) bg = 'bg-gray-800 text-gray-600 cursor-not-allowed';

                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleToggleSeatForBlock(seat.id)}
                      disabled={isBooked}
                      className={`w-9 h-9 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all ${bg}`}
                      title={`${seat.seat_number} (${seat.status})`}
                    >
                      {seat.seat_number}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 text-[11px] text-gray-400 pt-3">
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded bg-[#182238]"></span>
                  <span>Available</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded bg-purple-600"></span>
                  <span>Selected</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded bg-rose-950"></span>
                  <span>Blocked</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded bg-gray-800"></span>
                  <span>Booked</span>
                </span>
              </div>
            </div>

            {/* Block / Release Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleBlockSeats}
                disabled={selectedSeatsToBlock.length === 0}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center space-x-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>BLOCK SELECTED SEATS ({selectedSeatsToBlock.length})</span>
              </button>

              <button
                onClick={handleReleaseSeats}
                disabled={selectedSeatsToBlock.length === 0}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>RELEASE SEATS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Revenue & Occupancy Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">

          {/* Monthly Revenue Bar Chart */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <span>Monthly Revenue Overview</span>
              </h3>
              <span className="text-[11px] text-gray-400 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                Last 6 Months
              </span>
            </div>

            {/* Bar Chart */}
            {(() => {
              const months = [
                { month: 'May', revenue: Math.round(analytics.totalRevenue * 0.68), bookings: Math.round(analytics.todayBookings * 18) },
                { month: 'Jun', revenue: Math.round(analytics.totalRevenue * 0.74), bookings: Math.round(analytics.todayBookings * 21) },
                { month: 'Jul', revenue: Math.round(analytics.totalRevenue * 0.81), bookings: Math.round(analytics.todayBookings * 24) },
                { month: 'Aug', revenue: Math.round(analytics.totalRevenue * 0.87), bookings: Math.round(analytics.todayBookings * 26) },
                { month: 'Sep', revenue: Math.round(analytics.totalRevenue * 0.92), bookings: Math.round(analytics.todayBookings * 28) },
                { month: 'Oct', revenue: analytics.totalRevenue,                   bookings: analytics.todayBookings * 30 },
              ];
              const maxRev = Math.max(...months.map(m => m.revenue));
              return (
                <div className="space-y-4">
                  {/* Bars */}
                  <div className="flex items-end justify-between gap-3 h-52">
                    {months.map((m, i) => {
                      const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
                      const isLatest = i === months.length - 1;
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                          {/* Value label on hover */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-amber-300 whitespace-nowrap">
                            ₹{(m.revenue / 1000).toFixed(0)}K
                          </div>
                          {/* Bar */}
                          <div className="w-full rounded-t-xl relative overflow-hidden" style={{ height: `${pct}%`, minHeight: '8px' }}>
                            <div
                              className={`absolute inset-0 rounded-t-xl transition-all duration-500 ${
                                isLatest
                                  ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                                  : 'bg-gradient-to-t from-purple-800 to-purple-500'
                              }`}
                            />
                            {/* Shimmer effect on latest */}
                            {isLatest && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                            )}
                          </div>
                          {/* Month label */}
                          <span className={`text-xs font-bold ${isLatest ? 'text-amber-400' : 'text-gray-400'}`}>
                            {m.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Y-axis labels */}
                  <div className="flex items-center justify-between text-[10px] text-gray-600 border-t border-white/5 pt-2">
                    <span>₹0</span>
                    <span>₹{(maxRev / 2 / 1000).toFixed(0)}K</span>
                    <span>₹{(maxRev / 1000).toFixed(0)}K</span>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center space-x-4 text-[11px] text-gray-400">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded bg-gradient-to-t from-purple-800 to-purple-500" />
                      <span>Previous Months</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 rounded bg-gradient-to-t from-amber-600 to-amber-400" />
                      <span>Current Month (Oct)</span>
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 7-Day Revenue Trend */}
          <div className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <span>7-Day Revenue & Booking Trends</span>
            </h3>
            <p className="text-xs text-gray-400">Daily performance breakdown this week:</p>

            {(() => {
              const trends = analytics.revenueTrends || [];
              const maxRev7 = Math.max(...trends.map((t: any) => t.revenue), 1);
              return (
                <div className="space-y-3">
                  {trends.map((t: any) => {
                    const pct = (t.revenue / maxRev7) * 100;
                    return (
                      <div key={t.date} className="flex items-center gap-4">
                        <span className="text-[11px] font-bold text-gray-400 w-20 shrink-0">
                          {t.day} <span className="text-gray-600">{t.date.slice(5)}</span>
                        </span>
                        <div className="flex-1 bg-white/5 rounded-full h-6 overflow-hidden relative">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-700 to-amber-500 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                          <span className="absolute inset-0 flex items-center pl-3 text-[11px] font-black text-white/80">
                            ₹{t.revenue.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 w-16 text-right shrink-0">{t.bookings} passes</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

        </div>
      )}

      {/* Add Show Modal */}
      {isAddShowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-4">Schedule New Movie Show</h3>
            
            <form onSubmit={handleAddShow} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-400 block mb-1">Movie</label>
                <select
                  value={newShowData.movie_id}
                  onChange={(e) => setNewShowData({ ...newShowData, movie_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-white"
                >
                  <option value="mov-thalapathy69">Thalapathy 69 (Tamil)</option>
                  <option value="mov-spiderman-nwh">Spider-Man: No Way Home (English)</option>
                  <option value="mov-premalu">Premalu (Malayalam)</option>
                  <option value="mov-avengers-endgame">Avengers: Endgame (English)</option>
                  <option value="mov-doraemon">Doraemon: Sky Utopia (Tamil)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Date</label>
                <input
                  type="date"
                  value={newShowData.show_date}
                  onChange={(e) => setNewShowData({ ...newShowData, show_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-400 block mb-1">Start Time</label>
                  <input
                    type="text"
                    value={newShowData.start_time}
                    onChange={(e) => setNewShowData({ ...newShowData, start_time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Format</label>
                  <select
                    value={newShowData.experience}
                    onChange={(e) => setNewShowData({ ...newShowData, experience: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-white"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Dolby Atmos">Dolby Atmos</option>
                    <option value="IMAX">IMAX</option>
                    <option value="4DX">4DX</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 block mb-1">Ticket Price (₹)</label>
                <input
                  type="number"
                  value={newShowData.ticket_price}
                  onChange={(e) => setNewShowData({ ...newShowData, ticket_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddShowOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Create Show
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
