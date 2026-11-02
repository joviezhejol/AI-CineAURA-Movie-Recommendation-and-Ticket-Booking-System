import React, { useState } from 'react';
import { api } from '../services/api';
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Search,
  ScanLine,
  RefreshCw
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess?: () => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleVerify = async (tokenOrRef?: string) => {
    const targetCode = tokenOrRef || code;
    if (!targetCode.trim()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const res = await api.verifyTicket(targetCode.trim(), 'Priya Murugan (Gate Staff)');
      setVerificationResult(res);
      if (res.verified && onScanSuccess) {
        onScanSuccess();
      }
    } catch (err: any) {
      setVerificationResult({
        verified: false,
        status: 'ERROR',
        message: err.message || 'Verification failed. Please check network connection.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#0f172a] border border-blue-500/30 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/40 flex items-center justify-center mx-auto mb-2 shadow-lg">
            <ScanLine className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-white">Gate Pass Verification Scanner</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Scan customer QR pass or enter token / booking ID
          </p>
        </div>

        {/* Camera simulation box */}
        <div className="relative aspect-video rounded-2xl bg-black/60 border border-white/10 flex flex-col items-center justify-center overflow-hidden mb-5">
          {/* Laser scan line effect */}
          <div className="absolute inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse"></div>
          <QrCode className="w-16 h-16 text-cyan-400/40" />
          <span className="text-[11px] font-mono text-cyan-300 mt-2">
            [ OPTICAL QR SCANNER ACTIVE ]
          </span>
        </div>

        {/* Input & Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">
              Enter QR Token or Booking Reference (e.g. CINE-...)
            </label>
            <div className="flex items-center px-3 py-2 rounded-xl bg-[#141d33] border border-white/10">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste code or token..."
                className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isVerifying || !code.trim()}
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying ticket database...</span>
              </>
            ) : (
              <span>Verify & Check-In Customer</span>
            )}
          </button>
        </form>

        {/* Result Card */}
        {verificationResult && (
          <div className={`mt-5 p-4 rounded-2xl border text-xs leading-relaxed ${
            verificationResult.verified
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              : verificationResult.status === 'ALREADY_CHECKED_IN'
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
              : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
          }`}>
            <div className="flex items-center space-x-2 font-bold mb-1">
              {verificationResult.verified ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span>{verificationResult.message}</span>
            </div>

            {verificationResult.booking && (
              <div className="mt-2 pt-2 border-t border-white/10 text-[11px] text-gray-300 space-y-1">
                <p>👤 <strong>Guest:</strong> {verificationResult.booking.customer_name}</p>
                <p>🎬 <strong>Movie:</strong> {verificationResult.booking.movie_title}</p>
                <p>📽️ <strong>Screen:</strong> {verificationResult.booking.screen_name}</p>
                <p>💺 <strong>Confirmed Seats:</strong> <span className="font-bold text-white">{verificationResult.booking.seat_names}</span></p>
                <p>📅 <strong>Show:</strong> {verificationResult.booking.show_date} | {verificationResult.booking.start_time}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
