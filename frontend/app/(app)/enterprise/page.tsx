'use client';
import { useEffect, useState } from 'react';

const BRAND = '#1B365D', GOLD = '#D4AF37';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://www.psychometriccoach.com/api/v1';
const hdr = (): Record<string, string> => { const t = localStorage.getItem('psy_token') || ''; return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }; };

export default function EnterprisePage() {
  const [bank, setBank] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [drag, setDrag] = useState<number | null>(null);
  const [emails, setEmails] = useState('');
  const [testId, setTestId] = useState('');
  const [invites, setInvites] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => { fetch(`${API}/testbuilder/bank`, { headers: hdr() }).then(r => r.json()).then(d => setBank(d.questions || [])).catch(() => setErr('Could not load the question bank.')); }, []);

  const addItem = (item: any) => { if (!sel.find(s => s.id === item.id)) setSel([...sel, item]); };
  const removeItem = (id: string) => setSel(sel.filter(s => s.id !== id));
  const onDrop = (to: number) => { if (drag === null || drag === to) return; const c = [...sel]; const [m] = c.splice(drag, 1); c.splice(to, 0, m); setSel(c); setDrag(null); };

  const createTest = async () => {
    setErr(''); setMsg('');
    if (!title || !sel.length) { setErr('Enter a title and add at least one question.'); return; }
    try {
      const r = await fetch(`${API}/testbuilder`, { method: 'POST', headers: hdr(), body: JSON.stringify({ title, questionIds: sel.map(s => s.id), isPublic: true }) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setTestId(d.test.id); setMsg(`Test created. Invite link: ${location.origin}/invite/${d.test.linkToken}`);
    } catch (e: any) { setErr(e.message); }
  };
  const sendInvites = async () => {
    setErr(''); setMsg('');
    const list = emails.split(/[\n,;]+/).map(x => x.trim()).filter(Boolean);
    if (!testId || !list.length) { setErr('Create the test first, then enter candidate emails.'); return; }
    try {
      const r = await fetch(`${API}/testbuilder/${testId}/invites`, { method: 'POST', headers: hdr(), body: JSON.stringify({ emails: list }) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setInvites(d.links || []); setMsg(`Invites generated for ${(d.links || []).length} candidate(s).`);
    } catch (e: any) { setErr(e.message); }
  };
  const dlCsv = async () => { try { const r = await fetch(`${API}/growth/msr/export/csv`, { headers: hdr() }); if (!r.ok) throw new Error((await r.json()).error || 'Export failed'); const b = await r.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'msr.csv'; a.click(); } catch (e: any) { setErr(e.message); } };
  const openPdf = async () => { try { const r = await fetch(`${API}/growth/msr/export/pdf`, { headers: hdr() }); if (!r.ok) throw new Error((await r.json()).error || 'Export failed'); const html = await r.text(); const w = window.open('', '_blank'); if (w) w.document.write(html); } catch (e: any) { setErr(e.message); } };

  const filtered = bank.filter(b => !query || b.text.toLowerCase().includes(query.toLowerCase()));
  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 20 } as const;
  const inp = { border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, width: '100%' } as const;
  const btn = { background: GOLD, color: BRAND, fontWeight: 800, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14 } as const;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: 20 }}>
      <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>Enterprise Management</span>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '12px 0 16px' }}>Enterprise Hub</h1>
      {(msg || err) && <p style={{ color: err ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{err || msg}</p>}

      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>📄 Monthly Status Report</h3>
        <p style={{ color: '#64748b', fontSize: 13.5, marginBottom: 12 }}>Automatically compiled monthly. Export the latest MSR for your team.</p>
        <button onClick={dlCsv} style={{ ...btn, marginRight: 10 }}>⬇ Download CSV</button>
        <button onClick={openPdf} style={{ ...btn, background: BRAND, color: '#fff' }}>🖨 Print / Save PDF</button>
      </div>

      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>🧩 Test Builder</h3>
        <input placeholder="Test title (e.g. Senior Sales Screen)" value={title} onChange={e => setTitle(e.target.value)} style={{ ...inp, marginBottom: 10 }} />
        <input placeholder="Search the 300+ question bank…" value={query} onChange={e => setQuery(e.target.value)} style={{ ...inp, marginBottom: 10 }} />
        <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 12 }}>
          {filtered.slice(0, 40).map(b => (
            <div key={b.id} onClick={() => addItem(b)} style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: 13 }}>
              <b style={{ color: BRAND }}>{b.subSkill}</b> · D{b.difficulty} — {b.text.slice(0, 90)}…
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 6px' }}>Selected ({sel.length}) — drag to reorder:</p>
        {sel.map((s, i) => (
          <div key={s.id} draggable onDragStart={() => setDrag(i)} onDragOver={e => e.preventDefault()} onDrop={() => onDrop(i)}
            style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 10px', border: '1px dashed #cbd5e1', borderRadius: 8, marginBottom: 6, fontSize: 13, background: '#f8fafc' }}>
            <span>☰ {s.text.slice(0, 70)}…</span>
            <button onClick={() => removeItem(s.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
        ))}
        <button onClick={createTest} style={btn}>Create test + generate link</button>
      </div>

      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>✉️ Bulk Candidate Invites</h3>
        <textarea placeholder="Candidate emails — one per line (bulk paste supported)" value={emails} onChange={e => setEmails(e.target.value)} style={{ ...inp, minHeight: 90, marginBottom: 10 }} />
        <button onClick={sendInvites} style={btn}>Generate + send invites</button>
        {invites.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {invites.map(l => (
              <p key={l.token} style={{ fontSize: 13, margin: '4px 0' }}>
                <b>{l.email}</b> — <a href={l.url} style={{ color: BRAND }}>{l.url}</a> {l.emailed ? '· ✉️ emailed' : '· ⚠️ email relay off — copy manually'}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
