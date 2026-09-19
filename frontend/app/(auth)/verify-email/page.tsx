'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { authApi } from '../../../lib/api';

function VerifyInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<'verifying' | 'ok' | 'expired' | 'error'>('verifying');
  const [email, setEmail] = useState('');
  const [resent, setResent] = useState(false);

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setState('error'); return; }
    authApi.verifyEmail(token)
      .then(() => setState('ok'))
      .catch((err: unknown) => {
        const data = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { expired?: boolean; email?: string } } }).response?.data
          : undefined;
        if (data?.email) setEmail(data.email);
        setState(data?.expired ? 'expired' : 'error');
      });
  }, [params]);

  const box: React.CSSProperties = { maxWidth: 460, width: '100%', background: '#fff', borderRadius: 18, padding: 36, textAlign: 'center' };
  const wrap: React.CSSProperties = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'linear-gradient(160deg,#1B365D 0%,#12233f 100%)' };
  const primaryBtn: React.CSSProperties = { marginTop: 18, background: '#D4AF37', color: '#1B365D', fontWeight: 800, border: 'none', padding: '12px 22px', borderRadius: 10, cursor: 'pointer', width: '100%', fontSize: 15 };
  const ghostBtn: React.CSSProperties = { marginTop: 10, background: 'transparent', color: '#1B365D', fontWeight: 700, border: '1px solid #1B365D', padding: '12px 22px', borderRadius: 10, cursor: 'pointer', width: '100%', fontSize: 15 };

  return (
    <div style={wrap}>
      <div style={box}>
        {state === 'verifying' && (<>
          <div style={{ fontSize: 48 }}>⏳</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1B365D', margin: '10px 0' }}>Verifying your email…</h1>
        </>)}
        {state === 'ok' && (<>
          <div style={{ fontSize: 54 }}>✅</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#1B365D', margin: '10px 0 8px' }}>Email verified!</h1>
          <p style={{ color: '#475569', fontSize: 15 }}>Your account is now active. You can sign in and start practising.</p>
          <button onClick={() => router.push('/login')} style={primaryBtn}>Sign in now</button>
        </>)}
        {state === 'expired' && (<>
          <div style={{ fontSize: 54 }}>⌛</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1B365D', margin: '10px 0 8px' }}>Link expired</h1>
          <p style={{ color: '#475569', fontSize: 15 }}>This verification link has expired. We can send you a fresh one.</p>
          <button
            onClick={async () => { if (!email) { router.push('/login'); return; } try { await authApi.resendVerification(email); } catch {} setResent(true); }}
            style={primaryBtn}>{resent ? 'New link sent ✓' : 'Send a new link'}</button>
          <button onClick={() => router.push('/login')} style={ghostBtn}>Go to sign in</button>
        </>)}
        {state === 'error' && (<>
          <div style={{ fontSize: 54 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#1B365D', margin: '10px 0 8px' }}>Verification failed</h1>
          <p style={{ color: '#475569', fontSize: 15 }}>This link is invalid or has already been used. If you already verified, just sign in.</p>
          <button onClick={() => router.push('/login')} style={primaryBtn}>Go to sign in</button>
          <Link href="/register" style={{ display: 'block', marginTop: 14, color: '#64748b', fontSize: 13 }}>Create a new account</Link>
        </>)}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>}>
      <VerifyInner />
    </Suspense>
  );
}
