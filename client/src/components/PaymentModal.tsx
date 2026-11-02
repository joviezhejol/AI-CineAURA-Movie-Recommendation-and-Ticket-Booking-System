import React, { useState } from 'react';
import { api, Booking, Seat, Show } from '../services/api';
import confetti from 'canvas-confetti';
import {
  CreditCard,
  QrCode,
  Building,
  ShieldCheck,
  X,
  Phone,
  Mail,
  User,
  MessageSquare,
  Lock,
  ArrowRight,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: Show;
  selectedSeats: Seat[];
  seatType: string;
  sessionId: string;
  userId?: string | null;
  userEmail?: string;
  userName?: string;
  userPhone?: string;
  onBookingSuccess: (booking: Booking, whatsappLog: any) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  show,
  selectedSeats,
  seatType,
  sessionId,
  userId,
  userEmail = '',
  userName = '',
  userPhone = '',
  onBookingSuccess
}) => {
  const [customerName, setCustomerName] = useState(userName || 'Aditya Raman');
  const [customerEmail, setCustomerEmail] = useState(userEmail || 'customer@cineaura.com');
  const [customerPhone, setCustomerPhone] = useState(userPhone || '+91 98401 23456');
  const [whatsappNumber, setWhatsappNumber] = useState(userPhone || '+91 98401 23456');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('aditya@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8921');
  const [cardExpiry, setCardExpiry] = useState('11/28');
  const [cardCvv, setCardCvv] = useState('389');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Price calculations
  const subtotal = selectedSeats.reduce((sum, s) => sum + (s.base_price || show.ticket_price || 190.0), 0);
  const convenienceFee = selectedSeats.length * 35.0;
  const taxAmount = (subtotal + convenienceFee) * 0.18;
  const totalAmount = Math.round((subtotal + convenienceFee + taxAmount) * 100) / 100;

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      setProcessStep('Connecting to CineAura Secure Gateway...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessStep('Verifying atomic 5-minute seat hold with cinema server...');
      await new Promise((r) => setTimeout(r, 700));

      setProcessStep('Authorizing payment transaction...');
      await new Promise((r) => setTimeout(r, 800));

      // Call server atomic booking endpoint
      const res = await api.createBooking({
        showId: show.id,
        seatIds: selectedSeats.map((s) => s.id),
        seatType,
        sessionId,
        userId: userId || null,
        customerName,
        customerEmail,
        customerPhone,
        whatsappNumber: whatsappNumber || customerPhone,
        paymentMethod,
        paymentDetails: {
          transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
          method: paymentMethod,
          upiId: paymentMethod === 'UPI' ? upiId : undefined
        }
      });

      if (!res.success) {
        throw new Error(res.error || 'Payment failed or seat reservation expired');
      }

      setProcessStep('Generating digital pass, QR verification and dispatching WhatsApp confirmation...');
      await new Promise((r) => setTimeout(r, 500));

      // Fire celebratory confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      onBookingSuccess(res.booking, res.whatsappNotification);
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-white/15 rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Checkout & Secure Payment</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              256-Bit Encrypted Payment • Powered by CineAura Pay
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-white disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Processing Overlay if in progress */}
        {isProcessing && (
          <div className="absolute inset-0 bg-[#0f172a]/95 rounded-3xl z-30 flex flex-col items-center justify-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-transparent animate-spin"></div>
            <h4 className="text-base font-bold text-white">Processing Booking</h4>
            <p className="text-xs text-amber-300 font-medium animate-pulse text-center">
              {processStep}
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handlePayNow} className="space-y-6">
          
          {/* Order Summary Card */}
          <div className="p-4 rounded-2xl bg-[#090d16] border border-white/5 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">{show.movie_title}</h4>
                <p className="text-xs text-gray-400">
                  {show.theatre_name} • {show.screen_name} ({show.experience})
                </p>
                <p className="text-xs text-amber-400 font-medium mt-0.5">
                  {show.show_date} | {show.start_time}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  {selectedSeats.length} {selectedSeats.length === 1 ? 'Ticket' : 'Tickets'}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Seats: {selectedSeats.map((s) => s.seat_number).sort().join(', ')}
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="pt-3 border-t border-white/5 space-y-1.5 text-xs text-gray-300">
              <div className="flex justify-between">
                <span>Tickets Base Amount</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Integrated Convenience Fee</span>
                <span>₹{convenienceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Integrated GST (18%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-black text-amber-400">
                <span>Total Amount Payable</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Customer Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Full Name</label>
                <div className="flex items-center px-3 py-2 rounded-xl bg-[#141d33] border border-white/10">
                  <User className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Email (for Invoice)</label>
                <div className="flex items-center px-3 py-2 rounded-xl bg-[#141d33] border border-white/10">
                  <Mail className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Mobile Phone</label>
                <div className="flex items-center px-3 py-2 rounded-xl bg-[#141d33] border border-white/10">
                  <Phone className="w-3.5 h-3.5 text-gray-400 mr-2" />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-emerald-400 block mb-1 font-semibold">
                  WhatsApp Number (for Instant Pass)
                </label>
                <div className="flex items-center px-3 py-2 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400 mr-2" />
                  <input
                    type="tel"
                    required
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">
              Select Payment Method
            </h4>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'UPI'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <QrCode className="w-5 h-5 mx-auto mb-1 text-amber-400" />
                <span className="text-xs font-bold block">UPI / QR</span>
                <span className="text-[10px] text-gray-400">GPay, PhonePe</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <CreditCard className="w-5 h-5 mx-auto mb-1 text-cyan-400" />
                <span className="text-xs font-bold block">Card</span>
                <span className="text-[10px] text-gray-400">Credit / Debit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('NETBANKING')}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  paymentMethod === 'NETBANKING'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Building className="w-5 h-5 mx-auto mb-1 text-purple-400" />
                <span className="text-xs font-bold block">Net Banking</span>
                <span className="text-[10px] text-gray-400">All Banks</span>
              </button>
            </div>
          </div>

          {/* Payment Method Inputs */}
          {paymentMethod === 'UPI' && (
            <div className="p-4 rounded-2xl bg-[#090d16] border border-white/5 space-y-2">
              <label className="text-[11px] text-gray-400 block">UPI VPA Handle</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-xs text-white focus:outline-none"
                  placeholder="username@okaxis"
                />
                <span className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Instant Verified
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'CARD' && (
            <div className="p-4 rounded-2xl bg-[#090d16] border border-white/5 space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-xs text-white focus:outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'NETBANKING' && (
            <div className="p-4 rounded-2xl bg-[#090d16] border border-white/5 space-y-2">
              <label className="text-[11px] text-gray-400 block">Select Preferred Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#141d33] border border-white/10 text-xs text-white focus:outline-none"
              >
                <option value="HDFC Bank">HDFC Bank</option>
                <option value="State Bank of India">State Bank of India (SBI)</option>
                <option value="ICICI Bank">ICICI Bank</option>
                <option value="Axis Bank">Axis Bank</option>
                <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-extrabold text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Confirm & Pay ₹{totalAmount.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[10px] text-gray-500 text-center mt-2 flex items-center justify-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Instant QR Pass and WhatsApp confirmation will be dispatched upon authorization</span>
            </p>
          </div>

        </form>
      </div>
    </div>
  );
};
