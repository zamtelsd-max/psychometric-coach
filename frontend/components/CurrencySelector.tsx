'use client';
import { useState, useRef, useEffect } from 'react';
import { SUPPORTED_CURRENCIES } from '../lib/currency';
import { useCurrency } from '../hooks/useCurrency';

export default function CurrencySelector() {
  const { selectedCurrency, setSelectedCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const cur = SUPPORTED_CURRENCIES.find(c => c.code === selectedCurrency) || SUPPORTED_CURRENCIES[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 transition-all bg-white"
        aria-label="Change currency">
        <span>{cur.flag}</span>
        <span className="text-xs">{cur.code}</span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 min-w-[200px]">
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider px-4 py-1.5">Select Currency</p>
          {SUPPORTED_CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => { setSelectedCurrency(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-all text-left ${c.code === selectedCurrency ? 'bg-blue-50' : ''}`}>
              <span className="text-base">{c.flag}</span>
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-900">{c.code}</span>
                <span className="text-xs text-gray-400 ml-2">{c.symbol}</span>
              </div>
              <span className="text-xs text-gray-400">{c.name}</span>
              {c.code === selectedCurrency && <span className="text-[#0A528A] text-sm">✓</span>}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 px-4 pt-2 pb-1">
            <p className="text-[10px] text-gray-400">Prices shown in selected currency. Billing in USD.</p>
          </div>
        </div>
      )}
    </div>
  );
}
