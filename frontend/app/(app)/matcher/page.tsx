'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enterpriseApi } from '../../../lib/api';

const BRAND = '#1B365D', GOLD = '#D4AF37';

export default function MatcherPage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [jobDesc, setJobDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [teaser, setTeaser] = useState<any>(null);
  const [matchId, setMatchId] = useState('');
  const [email, setEmail] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [err, setErr] = useState('');

  const onFile = async (f: File) => {
    setErr('');
    if (f.size > 5 * 1024 * 1024) { setErr('File too large — maximum 5 MB.'); return; } // SR-B2C-16
    setFileName(f.name);
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (ext === 'txt') { setResumeText(await f.text()); return; }
    if (ext === 'pdf') {
      try {
        const pdfjs: any = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.min.mjs' as any);
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';
        const buf = await f.arrayBuffer();
        const doc = await pdfjs.getDocument({ data: buf }).promise;
        let txt = '';
        for (let i = 1; i <= doc.numPages; i++) { const pg = await doc.getPage(i); const c = await pg.getTextContent(); txt += c.items.map((it: any) => it.str).join(' ') + '\n'; }
        setResumeText(txt);
      } catch { setErr('Could not read PDF — please paste your resume text below instead.'); }
      return;
    }
    if (ext === 'docx') {
      try {
        const m: any = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js' as any);
        const buf = await f.arrayBuffer();
        const r = await (window as any).mammoth.extractRawText({ arrayBuffer: buf });
        setResumeText(r.value);
      } catch { setErr('Could not read DOCX — please paste your resume text below instead.'); }
      return;
    }
    setErr('Unsupported file — use PDF, DOCX or TXT (or paste text below).');
  };

  const analyze = async () => {
    setErr(''); if (!resumeText.trim() || !jobDesc.trim()) { setErr('Add your resume and the target job description.'); return; }
    setLoading(true);
    try { const { data } = await enterpriseApi.analyzeResume(resumeText, jobDesc); setTeaser(data.teaser ? { ...data.teaser, score: data.score } : data); setMatchId(data.matchId); }
    catch (e: any) { setErr(e?.response?.data?.error || 'Analysis failed.'); }
    finally { setLoading(false); }
  };

  const unlock = async () => {
    setErr(''); if (!email.trim()) { setErr('Enter your email to see the full analysis.'); return; }
    setLoading(true);
    try { const { data } = await enterpriseApi.unlockMatch(matchId, email); setAnalysis(data.analysis); (window as any).__ip = data.interviewParams; }
    catch (e: any) { setErr(e?.response?.data?.error || 'Could not unlock.'); }
    finally { setLoading(false); }
  };

  const startInterview = () => {
    const ip = (window as any).__ip || {};
    router.push(`/interview?jobFamily=${encodeURIComponent(ip.jobFamily || 'General')}&tier=${encodeURIComponent(ip.tier || 'Mid')}&from=matcher`);
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>AI Resume Matcher</span>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '12px 0 4px' }}>How ready are you for that role?</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Upload your resume + paste the job description. Get an instant match score and your key gaps.</p>
      </div>

      {!teaser && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Your resume (PDF, DOCX or TXT · max 5 MB)</label>
          <label style={{ display: 'block', border: '2px dashed #cbd5e1', borderRadius: 12, padding: 22, textAlign: 'center', cursor: 'pointer', margin: '8px 0 6px' }}>
            <input type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files && onFile(e.target.files[0])} />
            <div style={{ fontSize: 26 }}>📄</div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{fileName || 'Drop or choose your resume'}</div>
          </label>
          <textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="…or paste your resume text here" rows={4}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontSize: 13, marginBottom: 12 }} />
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Target job description</label>
          <textarea value={jobDesc} onChange={e => setJobDesc(e.target.value)} placeholder="Paste the job description you're targeting" rows={4}
            style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, fontSize: 13, margin: '6px 0 12px' }} />
          {err && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: 10, borderRadius: 10, fontSize: 13, marginBottom: 10 }}>{err}</div>}
          <button onClick={analyze} disabled={loading} style={{ width: '100%', background: BRAND, color: '#fff', fontWeight: 800, padding: 14, borderRadius: 12, border: 'none', cursor: 'pointer' }}>
            {loading ? 'Analysing…' : 'Analyse my match →'}
          </button>
        </div>
      )}

      {teaser && !analysis && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: teaser.score >= 70 ? '#16a34a' : teaser.score >= 45 ? GOLD : '#dc2626' }}>{teaser.score}%</div>
          <p style={{ color: '#64748b', fontSize: 14 }}>match for a <b>{teaser.tier} {teaser.jobFamily}</b> role</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '14px 0' }}>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 16px' }}><div style={{ fontSize: 22, fontWeight: 900, color: '#16a34a' }}>{teaser.strengthsCount}</div><div style={{ fontSize: 11, color: '#64748b' }}>strengths</div></div>
            <div style={{ background: '#fef2f2', borderRadius: 10, padding: '10px 16px' }}><div style={{ fontSize: 22, fontWeight: 900, color: '#dc2626' }}>{teaser.gapsCount}</div><div style={{ fontSize: 11, color: '#64748b' }}>gaps to close</div></div>
          </div>
          <div style={{ background: BRAND, borderRadius: 14, padding: 18, color: '#fff', marginTop: 8 }}>
            <p style={{ fontWeight: 800, marginBottom: 8 }}>🔒 Unlock your full gap analysis</p>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email"
              style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', marginBottom: 10 }} />
            {err && <div style={{ color: '#fecaca', fontSize: 12, marginBottom: 8 }}>{err}</div>}
            <button onClick={unlock} disabled={loading} style={{ width: '100%', background: GOLD, color: BRAND, fontWeight: 800, padding: 13, borderRadius: 10, border: 'none', cursor: 'pointer' }}>
              {loading ? 'Unlocking…' : 'Show my full analysis'}
            </button>
          </div>
        </div>
      )}

      {analysis && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 46, fontWeight: 900, color: analysis.score >= 70 ? '#16a34a' : analysis.score >= 45 ? GOLD : '#dc2626' }}>{analysis.score}%</div>
            <p style={{ color: '#64748b', fontSize: 13 }}>{analysis.tier} {analysis.jobFamily}</p>
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#16a34a', margin: '10px 0 6px' }}>✓ Your strengths</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {[...(analysis.hardSkills || []), ...(analysis.softSkills || [])].slice(0, 20).map((s: string) => <span key={s} style={{ background: '#f0fdf4', color: '#166534', fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>{s}</span>)}
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', margin: '10px 0 6px' }}>⚠ Gaps to close</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {(analysis.gaps || []).length ? (analysis.gaps || []).map((s: string) => <span key={s} style={{ background: '#fef2f2', color: '#b91c1c', fontSize: 12, padding: '4px 10px', borderRadius: 20 }}>{s}</span>) : <span style={{ color: '#64748b', fontSize: 13 }}>No major gaps detected — great fit!</span>}
          </div>
          <button onClick={startInterview} style={{ width: '100%', background: GOLD, color: BRAND, fontWeight: 900, padding: 15, borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 15 }}>
            🎤 Practise these gaps in a mock interview →
          </button>
          <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Starts a Virtual Interview Panel targeting your {analysis.jobFamily} gaps</p>
        </div>
      )}
    </div>
  );
}
