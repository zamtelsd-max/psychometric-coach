'use client';
import { useEffect, useState } from 'react';

const BRAND = '#16335B', GOLD = '#E3B84B';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://http--psychometric-api--x7m7kyc8mh8j.code.run/api/v1';
const fontStack = "Inter, Roboto, system-ui, sans-serif";

export default function VerifyClient() {
  const [state, setState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const [cert, setCert] = useState<any>(null);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const parts = window.location.pathname.split('/').filter(Boolean);
    const pathSeg = parts[parts.indexOf('verify-certificate') + 1] || '';
    const stamp = qs.get('stamp') || (pathSeg && pathSeg !== 'entry' ? pathSeg : '');
    if (!stamp) { setState('invalid'); return; }
    fetch(`${API}/enterprise-v2/verify-certificate/${encodeURIComponent(stamp)}`)
      .then(r => r.json())
      .then(d => { if (d.valid) { setCert(d.certificate); setState('valid'); } else setState('invalid'); })
      .catch(() => setState('invalid'));
  }, []);

  const wrap: React.CSSProperties = { fontFamily: fontStack, minHeight: '100vh', background: 'linear-gradient(160deg,#16335B,#12233f)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 };
  const card: React.CSSProperties = { maxWidth: 560, width: '100%', background: '#fff', borderRadius: 18, padding: 40, textAlign: 'center' };

  if (state === 'loading') return <div style={wrap}><div style={card}>Verifying…</div></div>;
  if (state === 'invalid') return <div style={wrap}><div style={card}><div style={{ fontSize: 54 }}>❌</div><h1 style={{ color: BRAND }}>Certificate not found</h1><p style={{ color: '#64748b' }}>This confirmation stamp is invalid or the certificate does not exist.</p></div></div>;

  return (
    <div style={wrap}>
      <div style={{ ...card, borderTop: `6px solid ${GOLD}` }}>
        <div style={{ fontSize: 54 }}>🏆</div>
        <div style={{ fontSize: 12, letterSpacing: 2, color: GOLD, fontWeight: 800, textTransform: 'uppercase' }}>Verified Certificate</div>
        <h1 style={{ color: BRAND, fontSize: 26, fontWeight: 900, margin: '12px 0 4px' }}>{cert.candidateName}</h1>
        <p style={{ color: '#334155', fontSize: 16 }}>has successfully completed</p>
        <h2 style={{ color: BRAND, fontSize: 20, margin: '6px 0 16px' }}>{cert.trackTitle}</h2>
        <div style={{ display: 'inline-block', background: '#dcfce7', color: '#166534', fontWeight: 800, padding: '8px 20px', borderRadius: 99, fontSize: 18 }}>
          Final Grade: {Number(cert.finalGrade).toFixed(2)}%
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: '#64748b', borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <div>Confirmation Stamp: <b style={{ color: BRAND }}>{cert.confirmationStamp}</b></div>
          <div>Issued: {new Date(cert.issuedAt).toISOString().replace('T', ' ').slice(0, 19)} UTC</div>
        </div>
        <div style={{ marginTop: 16, fontSize: 11, color: '#94a3b8' }}>PsychometricCoach — fraud-proof public validation</div>
      </div>
    </div>
  );
}
