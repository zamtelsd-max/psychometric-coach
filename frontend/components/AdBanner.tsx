'use client';
import { useEffect, useState, useCallback } from 'react';
import { adsPublicApi } from '../lib/adsApi';
import { usePathname } from 'next/navigation';

interface Ad {
  id: string;
  headline: string;
  bodyText: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
  slot: string;
  advertiser: { companyName: string };
}

interface AdBannerProps {
  slot?: 'BANNER' | 'SIDEBAR' | 'IN_FEED' | 'FOOTER_BANNER';
  className?: string;
}

export default function AdBanner({ slot = 'BANNER', className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  const fetchAd = useCallback(() => {
    adsPublicApi.serve(slot, pathname)
      .then(r => { if (r.data && r.data.id) setAd(r.data); })
      .catch(() => {}); // silent fail — no ad if error
  }, [slot, pathname]);

  useEffect(() => { fetchAd(); }, [fetchAd]);

  const handleClick = () => {
    if (!ad) return;
    adsPublicApi.click(ad.id, pathname).catch(() => {});
    window.open(ad.ctaUrl, '_blank', 'noopener noreferrer');
  };

  if (!ad || dismissed) return null;

  if (slot === 'BANNER' || slot === 'FOOTER_BANNER') {
    return (
      <div className={`relative bg-gradient-to-r from-brand/5 to-blue-50 border border-brand/15 rounded-2xl overflow-hidden ${className}`}>
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-400 text-xs flex items-center justify-center z-10 transition-all"
          aria-label="Close ad">✕</button>
        <span className="absolute top-2 left-3 text-[9px] text-gray-400 font-medium uppercase tracking-wider">Sponsored</span>
        <div className="flex items-center gap-4 p-4 pt-6">
          {ad.imageUrl && (
            <img src={ad.imageUrl} alt={ad.advertiser.companyName} className="w-16 h-16 rounded-xl object-cover shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-snug mb-0.5">{ad.headline}</p>
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">{ad.bodyText}</p>
            <p className="text-[10px] text-gray-400">{ad.advertiser.companyName}</p>
          </div>
          <button
            onClick={handleClick}
            className="shrink-0 bg-brand text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-brand-dark transition-all whitespace-nowrap">
            {ad.ctaText}
          </button>
        </div>
      </div>
    );
  }

  if (slot === 'SIDEBAR') {
    return (
      <div className={`relative bg-white border border-gray-100 rounded-2xl overflow-hidden ${className}`}>
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-[10px] flex items-center justify-center" aria-label="Close">✕</button>
        <span className="block text-[9px] text-gray-400 font-medium uppercase tracking-wider px-4 pt-3 pb-1">Ad</span>
        {ad.imageUrl && <img src={ad.imageUrl} alt="" className="w-full h-32 object-cover" />}
        <div className="p-4">
          <p className="font-bold text-gray-900 text-sm mb-1">{ad.headline}</p>
          <p className="text-xs text-gray-500 mb-3">{ad.bodyText}</p>
          <button onClick={handleClick} className="w-full bg-brand text-white text-xs font-bold py-2.5 rounded-xl hover:bg-brand-dark transition-all">{ad.ctaText}</button>
          <p className="text-[9px] text-gray-400 text-center mt-2">{ad.advertiser.companyName}</p>
        </div>
      </div>
    );
  }

  // IN_FEED
  return (
    <div className={`relative flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-3 ${className}`}>
      <button onClick={() => setDismissed(true)} className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white text-gray-400 text-[10px] flex items-center justify-center" aria-label="Close">✕</button>
      <span className="text-[9px] text-amber-500 font-bold uppercase shrink-0">Ad</span>
      {ad.imageUrl && <img src={ad.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 truncate">{ad.headline}</p>
        <p className="text-[10px] text-gray-500 truncate">{ad.bodyText}</p>
      </div>
      <button onClick={handleClick} className="shrink-0 text-xs font-bold text-brand border border-brand rounded-lg px-3 py-1.5 hover:bg-brand hover:text-white transition-all">{ad.ctaText}</button>
    </div>
  );
}
