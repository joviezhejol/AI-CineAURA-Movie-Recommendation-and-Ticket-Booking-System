import React from 'react';
import { Booking } from '../services/api';
import {
  Printer,
  MessageSquare,
  Ticket,
  CheckCircle2,
  X,
  MapPin,
  Calendar,
  Clock,
  Download,
  Film,
  Building2
} from 'lucide-react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  onViewWhatsApp: () => void;
  onGoToMyBookings: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  booking,
  onViewWhatsApp,
  onGoToMyBookings
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-amber-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Tag */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Booking Confirmed
          </span>
          <h2 className="text-xl font-black text-white mt-2">
            Your Digital Cinema Pass
          </h2>
          <p className="text-xs text-gray-400">
            Booking ID: <span className="font-mono text-amber-400 font-bold">{booking.booking_reference}</span>
          </p>
        </div>

        {/* Printable Ticket Pass Body */}
        <div id="printable-ticket" className="rounded-2xl bg-[#090d16] border border-white/10 p-5 space-y-4 shadow-inner relative overflow-hidden">
          
          {/* Top Notch Cutouts for Ticket aesthetic */}
          <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0f172a] border border-white/10"></div>
          <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0f172a] border border-white/10"></div>

          {/* Movie Title & Badges */}
          <div className="border-b border-dashed border-white/15 pb-4">
            <h3 className="text-base font-extrabold text-white">
              {booking.movie_title}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {booking.experience || 'Standard'} • {booking.seat_type} Pass
            </p>
          </div>

          {/* Venue & Show Details */}
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Cinema / Audi</p>
              <p className="font-bold text-white mt-0.5 truncate">{booking.theatre_name}</p>
              <p className="text-[11px] text-gray-400 truncate">{booking.screen_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase">Date & Showtime</p>
              <p className="font-bold text-amber-400 mt-0.5">{booking.show_date}</p>
              <p className="text-[11px] text-gray-300">{booking.start_time}</p>
            </div>
          </div>

          {/* Seats & Amount */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase">Confirmed Seats</p>
              <p className="text-sm font-black text-amber-400">{booking.seat_names}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase">Total Paid</p>
              <p className="text-sm font-black text-white">₹{booking.total_amount?.toFixed(2)}</p>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="pt-2 text-center flex flex-col items-center">
            {booking.qr_code_image && (
              <div className="p-2.5 rounded-xl bg-white shadow-lg inline-block">
                <img
                  src={booking.qr_code_image}
                  alt="Ticket QR Code"
                  className="w-36 h-36 object-contain"
                />
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2 font-mono tracking-wider">
              Token: {booking.qr_token}
            </p>
            <p className="text-[10px] text-emerald-400 font-medium">
              Scan this QR at the cinema gate for instant paperless admission
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handlePrint}
              className="py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 border border-white/10"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Ticket</span>
            </button>

            <button
              onClick={onViewWhatsApp}
              className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-600/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Pass</span>
            </button>
          </div>

          <button
            onClick={onGoToMyBookings}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5"
          >
            <Ticket className="w-4 h-4" />
            <span>View All My Bookings</span>
          </button>
        </div>

      </div>
    </div>
  );
};
