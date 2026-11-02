import React from 'react';
import { Booking } from '../services/api';
import { MessageSquare, X, CheckCheck, Phone, Video, MoreVertical, Send } from 'lucide-react';

interface WhatsAppPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

export const WhatsAppPreviewModal: React.FC<WhatsAppPreviewModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#111b21] border border-emerald-500/30 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden flex flex-col h-[580px] relative">
        
        {/* Close Button top-right outside header */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* WhatsApp Chat Header */}
        <div className="bg-[#202c33] p-3 px-4 flex items-center justify-between border-b border-[#2a3942]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center text-black font-extrabold text-sm ring-2 ring-emerald-500">
              CA
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <h4 className="text-sm font-bold text-white">AI CineAura Bot</h4>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </div>
              <p className="text-[10px] text-emerald-400">Official Cinema Ticketing</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-gray-300 pr-6">
            <Video className="w-4 h-4 opacity-75" />
            <Phone className="w-4 h-4 opacity-75" />
          </div>
        </div>

        {/* Chat Message Canvas */}
        <div className="flex-1 bg-[#0b141a] p-4 overflow-y-auto space-y-3 bg-[radial-gradient(#202c33_1px,transparent_1px)] [background-size:16px_16px]">
          
          {/* Timestamp Pill */}
          <div className="text-center">
            <span className="text-[10px] font-semibold text-gray-400 bg-[#182229] px-2.5 py-1 rounded-md shadow-sm">
              Today
            </span>
          </div>

          {/* Incoming WhatsApp Bubble */}
          <div className="flex justify-start">
            <div className="bg-[#202c33] text-gray-200 text-xs p-3.5 rounded-2xl rounded-tl-none max-w-[90%] shadow-md border border-[#2a3942] space-y-2 leading-relaxed">
              
              <div className="flex items-center space-x-1.5 text-amber-400 font-extrabold pb-1 border-b border-[#2a3942]">
                <span>🎬</span>
                <span>AI CINEAURA - TICKET CONFIRMATION</span>
              </div>

              <p>
                Hi <strong className="text-white">{booking.customer_name}</strong>, your tickets are confirmed! 🎟️
              </p>

              <div className="space-y-1 bg-[#111b21] p-2.5 rounded-xl text-[11px] font-mono border border-white/5">
                <p>🎬 <strong>Movie:</strong> {booking.movie_title}</p>
                <p>🏛️ <strong>Theatre:</strong> {booking.theatre_name}</p>
                <p>📽️ <strong>Screen:</strong> {booking.screen_name}</p>
                <p>📅 <strong>Date:</strong> {booking.show_date} | {booking.start_time}</p>
                <p>💺 <strong>Seats:</strong> <span className="text-amber-400 font-bold">{booking.seat_names}</span></p>
                <p>💳 <strong>Paid:</strong> ₹{booking.total_amount?.toFixed(2)}</p>
                <p>🔖 <strong>Ref:</strong> {booking.booking_reference}</p>
              </div>

              <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px]">
                <p className="text-emerald-300 font-bold">📲 Digital QR Ticket:</p>
                <p className="text-cyan-400 underline break-all mt-0.5">
                  http://cineaura.com/pass/{booking.qr_token}
                </p>
              </div>

              <p className="text-[10px] text-gray-400 italic">
                Please present the QR code at the gate 15 minutes before showtime. Enjoy the movie!
              </p>

              <div className="flex items-center justify-end space-x-1 pt-1 text-[10px] text-gray-400">
                <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
              </div>

            </div>
          </div>

        </div>

        {/* WhatsApp Fake Footer */}
        <div className="bg-[#202c33] p-2.5 px-3 flex items-center space-x-2 border-t border-[#2a3942]">
          <input
            type="text"
            readOnly
            value="Replies are handled automatically"
            className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-xs text-gray-400 focus:outline-none"
          />
          <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
            <Send className="w-4 h-4" />
          </div>
        </div>

      </div>
    </div>
  );
};
