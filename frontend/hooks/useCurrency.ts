'use client';
import { useState, useEffect, useCallback } from 'react';
import { getExchangeRates, detectUserCurrency, convertFromUSD, getCurrencyByCode, formatCurrency, USD_PRICES, type Currency } from '../lib/currency';

const STORAGE_KEY = 'psy_currency';

// Singleton rates cache shared across hook instances
let _rates: Record<string, number> = { USD: 1 };
let _ratesLoaded = false;
const _listeners: Set<() => void> = new Set();

function notifyListeners() { _listeners.forEach(fn => fn()); }

export function useCurrency() {
  const [selectedCurrency, _setSelected] = useState<string>(() => {
    if (typeof window === 'undefined') return 'USD';
    return localStorage.getItem(STORAGE_KEY) || 'USD';
  });
  const [rates, setRates] = useState<Record<string, number>>(_rates);
  const [tick, setTick] = useState(0);

  // Subscribe to rate updates
  useEffect(() => {
    const update = () => setTick(t => t + 1);
    _listeners.add(update);
    return () => { _listeners.delete(update); };
  }, []);

  // Load rates + auto-detect currency on first mount
  useEffect(() => {
    if (!_ratesLoaded) {
      _ratesLoaded = true;
      getExchangeRates().then(r => {
        _rates = r;
        setRates(r);
        notifyListeners();
      });
      // Auto-detect only if no preference saved
      if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)) {
        detectUserCurrency().then(code => {
          _setSelected(code);
          localStorage.setItem(STORAGE_KEY, code);
          notifyListeners();
        });
      }
    } else {
      setRates(_rates);
    }
  }, []);

  const setSelectedCurrency = useCallback((code: string) => {
    _setSelected(code);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, code);
    notifyListeners();
  }, []);

  const currency: Currency = getCurrencyByCode(selectedCurrency);

  // Convert a USD amount to the selected currency
  const convert = useCallback((usdAmount: number): number => {
    return convertFromUSD(usdAmount, selectedCurrency, rates);
  }, [selectedCurrency, rates, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Format a USD amount in the selected currency
  const format = useCallback((usdAmount: number): string => {
    const converted = convertFromUSD(usdAmount, selectedCurrency, rates);
    return formatCurrency(converted, currency);
  }, [selectedCurrency, rates, currency, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { selectedCurrency, setSelectedCurrency, currency, rates, convert, format, USD_PRICES };
}
