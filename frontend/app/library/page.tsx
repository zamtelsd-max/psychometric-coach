'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { questionsApi } from '../../lib/api';
import AdBanner from '../../components/AdBanner';

interface Category {
  id: string; name: string; slug: string; icon: string; color: string;
  description: string; _count?: { questions: number };
}

export default function LibraryPage() {
  const [cats, setCats] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    questionsApi.categories().then(r => setCats(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = cats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="pc-page">
      <div className="mb-6">
        <h1 className="pc-h1 mb-1">Question Library</h1>
        <p className="pc-sub">Choose a category to start practising · {cats.length} categories</p>
      </div>

      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="pc-input px-5 py-3.5"
          placeholder="🔍  Search categories..." aria-label="Search categories" />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({length:6}).map((_,i) => <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse"/>)}
        </div>
      ) : (
        <div>
          <AdBanner slot="IN_FEED" className="mb-4" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(cat => (
            <Link key={cat.id} href={`/practice?category=${cat.slug}`}
              className="pc-card pc-card-hover p-5 group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl" aria-hidden="true">{cat.icon}</span>
                <span className="pc-badge pc-badge-brand">{cat._count?.questions ?? 0} Q</span>
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-brand text-sm mb-1.5 transition-colors">{cat.name}</h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{cat.description}</p>
              <div className="mt-3 flex items-center text-xs text-brand font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Practice now →
              </div>
            </Link>
          ))}
          </div>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-sm">No categories match &quot;{search}&quot;</p>
        </div>
      )}
    </div>
  );
}
