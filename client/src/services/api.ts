// Typed API client for CineAura
const API_BASE = '/api';

export interface District {
  id: string;
  name: string;
  state: string;
}

export interface CastMember {
  name: string;
  role: string;
  photo?: string;
}

export interface Movie {
  id: string;
  tmdb_id?: number;
  title: string;
  tagline?: string;
  poster_url: string;
  backdrop_url: string;
  trailer_url?: string;
  language: string;
  secondary_languages: string[];
  genres: string[];
  duration_mins: number;
  certificate: string;
  rating: number;
  vote_count?: number;
  overview: string;
  director?: string;
  cast_members: CastMember[];
  release_date: string;
  mood_tags: string[];
  vibe_tags: string[];
  travel_tags: string[];
  is_active: number;
  is_now_showing?: boolean;
}

export interface Theatre {
  id: string;
  district_id: string;
  name: string;
  address: string;
  city: string;
  pin_code?: string;
  facilities: string[];
  rating: number;
  image_url?: string;
}

export interface Show {
  id: string;
  movie_id: string;
  theatre_id: string;
  screen_id: string;
  show_date: string;
  start_time: string;
  end_time: string;
  language: string;
  experience: string;
  ticket_price: number;
  status: string;
  movie_title?: string;
  movie_poster?: string;
  movie_backdrop?: string;
  movie_certificate?: string;
  movie_language?: string;
  theatre_name?: string;
  theatre_address?: string;
  theatre_city?: string;
  screen_name?: string;
}

export interface Seat {
  id: string;
  screen_id: string;
  seat_number: string;
  row_label: string;
  col_number: number;
  seat_tier: string;
  seat_type: 'SINGLE' | 'COUPLE' | 'FRIENDS' | 'FAMILY';
  couple_pair_id?: string | null;
  base_price: number;
  status: 'AVAILABLE' | 'SELECTED' | 'HELD' | 'BOOKED' | 'BLOCKED';
  expiresAt?: number | null;
  remainingSeconds?: number;
  isCurrentSession?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'manager' | 'employee';
  phone?: string;
  district_id?: string;
}

export interface Booking {
  id: string;
  booking_reference: string;
  show_id: string;
  user_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  whatsapp_number: string;
  seat_names: string;
  seat_ids?: string;
  seat_type: string;
  subtotal: number;
  tax_amount: number;
  convenience_fee: number;
  total_amount: number;
  payment_status: string;
  payment_id: string;
  payment_method: string;
  qr_token: string;
  qr_code_image: string;
  verification_status: 'PENDING' | 'CHECKED_IN' | 'CANCELLED';
  checked_in_at?: number;
  checked_in_by?: string;
  created_at: number;
  movie_title?: string;
  movie_poster?: string;
  movie_certificate?: string;
  movie_language?: string;
  theatre_name?: string;
  theatre_address?: string;
  theatre_city?: string;
  screen_name?: string;
  experience?: string;
  show_date?: string;
  start_time?: string;
}

export const api = {
  // Districts & Theatres
  async getDistricts(): Promise<{ districts: District[] }> {
    const res = await fetch(`${API_BASE}/theatres/districts`);
    return res.json();
  },

  async getTheatres(districtId?: string): Promise<{ theatres: Theatre[] }> {
    const url = districtId && districtId !== 'all' ? `${API_BASE}/theatres?district_id=${districtId}` : `${API_BASE}/theatres`;
    const res = await fetch(url);
    return res.json();
  },

  async getTheatreById(id: string): Promise<{ theatre: Theatre & { screens: any[] } }> {
    const res = await fetch(`${API_BASE}/theatres/${id}`);
    return res.json();
  },

  // Movies
  async getMovies(params: {
    district_id?: string;
    language?: string;
    genre?: string;
    experience?: string;
    search?: string;
    now_showing_only?: boolean;
  } = {}): Promise<{ count: number; movies: Movie[] }> {
    const query = new URLSearchParams();
    if (params.district_id) query.set('district_id', params.district_id);
    if (params.language) query.set('language', params.language);
    if (params.genre) query.set('genre', params.genre);
    if (params.experience) query.set('experience', params.experience);
    if (params.search) query.set('search', params.search);
    if (params.now_showing_only) query.set('now_showing_only', 'true');

    const res = await fetch(`${API_BASE}/movies?${query.toString()}`);
    return res.json();
  },

  async getMovieById(id: string, districtId?: string): Promise<{ movie: Movie & { available_theatres: any[]; available_dates: string[]; all_shows: Show[] } }> {
    const url = districtId ? `${API_BASE}/movies/${id}?district_id=${districtId}` : `${API_BASE}/movies/${id}`;
    const res = await fetch(url);
    return res.json();
  },

  // Shows & Seats
  async getShows(params: { movie_id?: string; theatre_id?: string; date?: string; district_id?: string } = {}): Promise<{ shows: Show[] }> {
    const query = new URLSearchParams(params as any);
    const res = await fetch(`${API_BASE}/shows?${query.toString()}`);
    return res.json();
  },

  async getShowById(id: string): Promise<{ show: Show }> {
    const res = await fetch(`${API_BASE}/shows/${id}`);
    return res.json();
  },

  async getShowSeats(showId: string, sessionId?: string): Promise<{ seats: Seat[] }> {
    const url = sessionId ? `${API_BASE}/shows/${showId}/seats?session_id=${sessionId}` : `${API_BASE}/shows/${showId}/seats`;
    const res = await fetch(url);
    return res.json();
  },

  // Holds (Atomic 5-minute seat locking)
  async holdSeats(payload: { showId: string; seatIds: string[]; sessionId: string; userId?: string | null }): Promise<{ success: boolean; heldSeats?: string[]; expiresAt?: number; error?: string }> {
    const res = await fetch(`${API_BASE}/holds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async releaseSeats(payload: { showId: string; sessionId: string; seatIds?: string[] }): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/holds/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getActiveHold(showId: string, sessionId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/holds/active?showId=${showId}&sessionId=${sessionId}`);
    return res.json();
  },

  // Bookings
  async createBooking(payload: any): Promise<{ success: boolean; booking: Booking; whatsappNotification?: any; error?: string }> {
    const res = await fetch(`${API_BASE}/bookings/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getBookingByRef(ref: string): Promise<{ booking: Booking }> {
    const res = await fetch(`${API_BASE}/bookings/ref/${ref}`);
    return res.json();
  },

  async getBookingByQr(qrToken: string): Promise<{ booking: Booking }> {
    const res = await fetch(`${API_BASE}/bookings/qr/${qrToken}`);
    return res.json();
  },

  async getMyBookings(params: { user_id?: string; email?: string; phone?: string }): Promise<{ bookings: Booking[] }> {
    const query = new URLSearchParams(params as any);
    const res = await fetch(`${API_BASE}/bookings/my-bookings?${query.toString()}`);
    return res.json();
  },

  async getWhatsAppLogs(phone: string): Promise<{ logs: any[] }> {
    const res = await fetch(`${API_BASE}/bookings/whatsapp/${phone}`);
    return res.json();
  },

  // Aura AI
  async chatWithAura(payload: {
    message?: string;
    mood?: string;
    vibe?: string;
    travelMood?: string;
    language?: string;
    districtId?: string;
  }): Promise<{ reply: string; suggestions?: string[]; recommendedMovies: Movie[] }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getAiOptions(): Promise<{ moods: string[]; vibes: string[]; travelMoods: string[] }> {
    const res = await fetch(`${API_BASE}/ai/options`);
    return res.json();
  },

  // Auth
  async login(email: string, password: string): Promise<{ success: boolean; user: User; token: string; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(data: any): Promise<{ success: boolean; user: User; token: string; error?: string }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async switchRole(role: 'customer' | 'manager' | 'employee'): Promise<{ success: boolean; user: User; token: string }> {
    const res = await fetch(`${API_BASE}/auth/switch-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  // Manager Portal
  async getManagerAnalytics(): Promise<any> {
    const res = await fetch(`${API_BASE}/manager/analytics`);
    return res.json();
  },

  async getManagerShows(params: { date?: string; theatre_id?: string } = {}): Promise<{ shows: any[] }> {
    const query = new URLSearchParams(params as any);
    const res = await fetch(`${API_BASE}/manager/shows?${query.toString()}`);
    return res.json();
  },

  async addShow(showData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/manager/shows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(showData)
    });
    return res.json();
  },

  async editShow(id: string, updateData: any): Promise<any> {
    const res = await fetch(`${API_BASE}/manager/shows/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    return res.json();
  },

  async cancelShow(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/manager/shows/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async blockSeats(showId: string, seatIds: string[], reason?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/manager/shows/${showId}/block-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatIds, reason })
    });
    return res.json();
  },

  async releaseManagerBlockedSeats(showId: string, seatIds: string[]): Promise<any> {
    const res = await fetch(`${API_BASE}/manager/shows/${showId}/release-seats`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatIds })
    });
    return res.json();
  },

  // Employee Portal
  async getEmployeeTodayShows(): Promise<{ shows: any[] }> {
    const res = await fetch(`${API_BASE}/employee/today-shows`);
    return res.json();
  },

  async searchEmployeeBookings(query: string): Promise<{ bookings: any[] }> {
    const res = await fetch(`${API_BASE}/employee/bookings/search?query=${encodeURIComponent(query)}`);
    return res.json();
  },

  async verifyTicket(code: string, employeeName?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/employee/verify-ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, employeeName })
    });
    return res.json();
  }
};
