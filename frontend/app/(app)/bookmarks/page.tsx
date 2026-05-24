'use client';
import { useEffect, useState } from 'react';
import { bookmarksApi } from '../../../lib/api';
import Link from 'next/link';

interface Bookmark {
  id: string;
  question: { id: string; text: string; category?: { name: string; icon: string }; difficulty: number };
  note?: string;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookmarksApi.list().then(r => setBookmarks(r.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const remove = async (questionId: string) => {
    await bookmarksApi.remove(questionId).catch(()=>{});
    setBookmarks(b => b.filter(x => x.question.id !== questionId));
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Bookmarks</h1>
      <p className="text-gray-500 text-sm mb-5">Questions you saved for later review</p>

      {loading ? (
        <div className="space-y-3">{[0,1,2].map(i=><div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"/>)}</div>
      ) : bookmarks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔖</div>
          <p className="text-gray-400 text-sm">No bookmarks yet</p>
          <Link href="/practice" className="mt-4 inline-block text-brand font-semibold text-sm hover:underline">Start Practising →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map(b => (
            <div key={b.id} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {b.question.category && (
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-xs">{b.question.category.icon}</span>
                      <span className="text-xs font-semibold text-gray-400">{b.question.category.name}</span>
                      <span className="ml-auto text-xs text-gray-300">Diff {b.question.difficulty}/10</span>
                    </div>
                  )}
                  <p className="text-sm font-medium text-gray-800 leading-relaxed line-clamp-3">{b.question.text}</p>
                  {b.note && <p className="text-xs text-gray-400 mt-2 italic">{b.note}</p>}
                </div>
                <button onClick={() => remove(b.question.id)} aria-label="Remove bookmark"
                  className="text-gray-300 hover:text-error text-lg shrink-0 transition-colors">✕</button>
              </div>
              <Link href={`/practice?questionId=${b.question.id}`}
                className="mt-3 text-xs text-brand font-semibold hover:underline block">
                Practice this question →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
