import React, { useState } from 'react';
import { Gift, Copy, Check, Sparkles, Tag, ShieldCheck } from 'lucide-react';

export const OffersPage: React.FC = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const offers = [
    {
      code: 'AURA100',
      title: 'Flat ₹100 Off on IMAX with Laser',
      description: 'Experience blockbusters in jaw-dropping IMAX scale. Valid on orders above ₹500.',
      badge: 'IMAX Special',
      color: 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    },
    {
      code: 'MOODMATCH',
      title: 'Complimentary Popcorn Combo',
      description: 'Book any movie curated by Aura AI mood system and get free gourmet popcorn at the counter.',
      badge: 'Aura AI Exclusive',
      color: 'border-purple-500/30 bg-purple-500/10 text-purple-300'
    },
    {
      code: 'HDFCSPECIAL',
      title: 'Flat 20% Off on HDFC Cards',
      description: 'Pay using any HDFC Bank Debit or Credit card on checkout to receive up to ₹150 off instantly.',
      badge: 'Bank Partner',
      color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
    },
    {
      code: 'ICICIVIP',
      title: 'Buy 1 Get 1 on VIP Recliners',
      description: 'Indulge in plush cinema recliners with ICICI Sapphiro and Coral credit cards.',
      badge: 'Luxury Cinema',
      color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    }
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center space-x-2">
          <Gift className="w-6 h-6 text-amber-400" />
          <span>Exclusive CineAura Offers & Deals</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Apply promotional promo codes during checkout for instant cinema savings.
        </p>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {offers.map((offer) => (
          <div
            key={offer.code}
            className="p-6 rounded-3xl bg-[#0f172a] border border-white/10 hover:border-amber-400/40 p-6 shadow-xl transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${offer.color}`}>
                  {offer.badge}
                </span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{offer.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{offer.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono text-sm font-bold text-amber-400">{offer.code}</span>
              </div>

              <button
                onClick={() => handleCopy(offer.code)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all"
              >
                {copiedCode === offer.code ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
