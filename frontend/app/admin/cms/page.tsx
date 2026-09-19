'use client';
import { useEffect, useRef, useState } from 'react';

const BRAND = '#1B365D', GOLD = '#D4AF37';
const API = process.env.NEXT_PUBLIC_API_URL || 'https://www.psychometriccoach.com/api/v1';
const hdr = (): Record<string, string> => { const t = localStorage.getItem('psy_token') || ''; return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }; };

export default function CmsStudioPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    fetch(`${API}/cms/media`, { headers: hdr() }).then(r => r.json()).then(d => setAssets(d.assets || [])).catch(() => {});
    fetch(`${API}/cms/cases`, { headers: hdr() }).then(r => r.json()).then(d => setCases(d.cases || [])).catch(() => {});
  };
  useEffect(() => { refresh(); }, []);

  const uploadFiles = async (files: FileList | File[]) => {
    setErr(''); setMsg(''); setUploading(true);
    for (const f of Array.from(files)) {
      if (!['image/png', 'image/jpeg', 'image/svg+xml'].includes(f.type)) { setErr(`${f.name}: PNG, JPEG or SVG only.`); continue; }
      if (f.size > 6 * 1024 * 1024) { setErr(`${f.name}: over the 6MB limit.`); continue; }
      const b64: string = await new Promise(res => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1] || ''); r.readAsDataURL(f); });
      try {
        const r = await fetch(`${API}/cms/media`, { method: 'POST', headers: hdr(), body: JSON.stringify({ filename: f.name, mime: f.type, dataBase64: b64 }) });
        const d = await r.json(); if (d.error) throw new Error(d.error);
      } catch (e: any) { setErr(e.message); }
    }
    setUploading(false); setMsg('Upload complete.'); refresh();
  };

  const del = async (id: string) => { try { await fetch(`${API}/cms/media/${id}`, { method: 'DELETE', headers: hdr() }); refresh(); } catch {} };

  const exec = (cmd: string, val?: string) => { editorRef.current?.focus(); document.execCommand(cmd, false, val); };
  const insertTable = () => exec('insertHTML', '<table border="1" style="border-collapse:collapse;width:100%"><tr><th style="padding:6px">Column 1</th><th style="padding:6px">Column 2</th><th style="padding:6px">Column 3</th></tr><tr><td style="padding:6px">&nbsp;</td><td style="padding:6px">&nbsp;</td><td style="padding:6px">&nbsp;</td></tr><tr><td style="padding:6px">&nbsp;</td><td style="padding:6px">&nbsp;</td><td style="padding:6px">&nbsp;</td></tr></table><p></p>');
  const insertImage = (a: any) => {
    setPickerOpen(false);
    exec('insertHTML', `<img src="${API}/cms/media/${a.id}" alt="${a.filename}" width="${a.width || 400}" height="${a.height || 300}" style="max-width:100%;height:auto;border-radius:8px" /><p></p>`);
  };
  const loadCase = (c: any) => { setEditingId(c.id); setTitle(c.title); if (editorRef.current) editorRef.current.innerHTML = c.bodyHtml; };
  const resetEditor = () => { setEditingId(null); setTitle(''); if (editorRef.current) editorRef.current.innerHTML = ''; };
  const saveCase = async () => {
    setErr(''); setMsg('');
    const bodyHtml = editorRef.current?.innerHTML || '';
    if (!title || !bodyHtml) { setErr('Title and some content are required.'); return; }
    try {
      const url = editingId ? `${API}/cms/cases/${editingId}` : `${API}/cms/cases`;
      const r = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: hdr(), body: JSON.stringify({ title, bodyHtml }) });
      const d = await r.json(); if (d.error) throw new Error(d.error);
      setMsg(editingId ? 'Case study updated.' : 'Case study saved.'); resetEditor(); refresh();
    } catch (e: any) { setErr(e.message); }
  };
  const delCase = async (id: string) => { try { await fetch(`${API}/cms/cases/${id}`, { method: 'DELETE', headers: hdr() }); if (editingId === id) resetEditor(); refresh(); } catch {} };

  const btn = { background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 8, padding: '6px 10px', fontSize: 13, cursor: 'pointer', marginRight: 4, marginBottom: 4 } as const;
  const abtn = { background: GOLD, color: BRAND, fontWeight: 800, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14 } as const;
  const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 20 } as const;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <span style={{ background: GOLD, color: BRAND, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '4px 12px', borderRadius: 20 }}>Super Admin Suite</span>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: BRAND, margin: '12px 0 16px' }}>📁 CMS Studio</h1>
      {(msg || err) && <p style={{ color: err ? '#dc2626' : '#16a34a', fontWeight: 700 }}>{err || msg}</p>}

      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>🖼 Media Asset Dropzone <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>(PNG · JPEG · SVG, up to 6MB — stored in your database, survives redeploys)</span></h3>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? GOLD : '#cbd5e1'}`, borderRadius: 14, padding: 34, textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(212,175,55,.08)' : '#f8fafc' }}>
          {uploading ? 'Uploading…' : <>📁 <b>Drop images here</b> or click to browse<br /><span style={{ fontSize: 12, color: '#64748b' }}>PNG · JPEG · SVG — optimized dimensions recorded automatically</span></>}
        </div>
        <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/svg+xml" style={{ display: 'none' }} onChange={e => e.target.files && uploadFiles(e.target.files)} />
        {assets.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12, marginTop: 14 }}>
            {assets.map(a => (
              <div key={a.id} style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', fontSize: 11 }}>
                <img src={`${API}/cms/media/${a.id}`} alt={a.filename} style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: 8 }}>
                  <p style={{ margin: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.filename}</p>
                  <p style={{ margin: '2px 0 6px', color: '#64748b' }}>{a.width || '?'}×{a.height || '?'} · {Math.round(a.sizeBytes / 1024)}KB</p>
                  <button onClick={() => navigator.clipboard.writeText(`${API}/cms/media/${a.id}`)} style={{ ...btn, marginRight: 4 }}>Copy URL</button>
                  <button onClick={() => del(a.id)} style={{ ...btn, color: '#dc2626' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ fontWeight: 800, marginBottom: 10 }}>📝 Case Study Editor <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>(rich text: headings, lists, tables, images)</span></h3>
        <div style={{ marginBottom: 10 }}>
          <input placeholder="Case study title (e.g. Retail Bank Fraud Scenario)" value={title} onChange={e => setTitle(e.target.value)} style={{ border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', fontSize: 14, width: '100%' }} />
        </div>
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px 10px 0 0', padding: 8, background: '#f8fafc' }}>
          <button onClick={() => exec('bold')} style={btn}><b>B</b></button>
          <button onClick={() => exec('italic')} style={btn}><i>I</i></button>
          <button onClick={() => exec('underline')} style={btn}><u>U</u></button>
          <button onClick={() => exec('formatBlock', '<h2>')} style={btn}>H2</button>
          <button onClick={() => exec('formatBlock', '<h3>')} style={btn}>H3</button>
          <button onClick={() => exec('formatBlock', '<p>')} style={btn}>¶</button>
          <button onClick={() => exec('insertUnorderedList')} style={btn}>• List</button>
          <button onClick={() => exec('insertOrderedList')} style={btn}>1. List</button>
          <button onClick={insertTable} style={btn}>▦ Table</button>
          <button onClick={() => { const u = prompt('Link URL:'); if (u) exec('createLink', u); }} style={btn}>🔗 Link</button>
          <button onClick={() => setPickerOpen(true)} style={btn}>🖼 Image</button>
        </div>
        <div contentEditable ref={editorRef} suppressContentEditableWarning
          style={{ minHeight: 220, border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 10px 10px', padding: 16, fontSize: 14.5, lineHeight: 1.6, outline: 'none' }} />
        <div style={{ marginTop: 12 }}>
          <button onClick={saveCase} style={abtn}>{editingId ? 'Update case study' : 'Save case study'}</button>
          {editingId && <button onClick={resetEditor} style={{ ...abtn, background: '#e2e8f0', marginLeft: 10 }}>New</button>}
        </div>
        {pickerOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }} onClick={() => setPickerOpen(false)}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 20, maxWidth: 640, maxHeight: '70vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
              <h4 style={{ fontWeight: 800, marginBottom: 12 }}>Pick a media asset</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                {assets.map(a => (
                  <div key={a.id} onClick={() => insertImage(a)} style={{ border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', overflow: 'hidden', fontSize: 10 }}>
                    <img src={`${API}/cms/media/${a.id}`} alt={a.filename} style={{ width: '100%', height: 70, objectFit: 'cover' }} />
                    <p style={{ margin: '4px 6px' }}>{a.filename}</p>
                  </div>
                ))}
                {!assets.length && <p style={{ fontSize: 13, color: '#64748b' }}>Upload images first.</p>}
              </div>
            </div>
          </div>
        )}
        {cases.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Saved case studies ({cases.length})</p>
            {cases.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 10, marginBottom: 6, fontSize: 13.5 }}>
                <span><b>{c.title}</b> <span style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(c.updatedAt || c.createdAt).toLocaleDateString()}</span></span>
                <span>
                  <button onClick={() => loadCase(c)} style={btn}>Edit</button>
                  <button onClick={() => delCase(c.id)} style={{ ...btn, color: '#dc2626' }}>Delete</button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
