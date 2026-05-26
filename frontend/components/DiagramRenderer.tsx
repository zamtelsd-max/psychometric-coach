'use client';
import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

interface DiagramData {
  type: 'pie' | 'bar' | 'line' | 'table' | 'passage' | 'chart_bar';
  title?: string;
  // Bar / Line
  labels?: string[];
  datasets?: { label: string; data: number[]; color: string }[];
  // Pie
  values?: number[];
  colors?: string[];
  // Table
  headers?: string[];
  rows?: string[][];
  highlightCol?: number;
  highlightRow?: number;
  // Passage
  text?: string;
}

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { position: 'bottom' as const, labels: { font: { size: 11 } } },
    title: { display: false },
  },
};

export default function DiagramRenderer({ data }: { data: DiagramData }) {
  if (!data) return null;

  // ── PIE CHART ──────────────────────────────────────────────────────────────
  if (data.type === 'pie') {
    const chartData = {
      labels: data.labels ?? [],
      datasets: [{
        data: data.values ?? [],
        backgroundColor: data.colors ?? ['#0A528A','#E4007C','#00843D','#F39C12','#8E44AD','#E74C3C','#2ECC71'],
        borderWidth: 2,
        borderColor: '#fff',
      }],
    };
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        {data.title && <p className="text-sm font-semibold text-slate-700 mb-3 text-center">{data.title}</p>}
        <div className="max-w-xs mx-auto">
          <Pie data={chartData} options={{
            ...CHART_OPTIONS,
            plugins: {
              ...CHART_OPTIONS.plugins,
              tooltip: {
                callbacks: {
                  label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed}%`
                }
              }
            }
          }} />
        </div>
        {/* Value legend */}
        <div className="mt-3 flex flex-wrap gap-2 justify-center">
          {(data.labels ?? []).map((lbl, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-slate-600">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: (data.colors ?? [])[i] ?? '#ccc' }} />
              {lbl}: {(data.values ?? [])[i]}%
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── BAR CHART ──────────────────────────────────────────────────────────────
  if (data.type === 'bar' || data.type === 'chart_bar') {
    const chartData = {
      labels: data.labels ?? [],
      datasets: (data.datasets ?? []).map(ds => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: ds.color + 'CC',
        borderColor: ds.color,
        borderWidth: 1,
      })),
    };
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        {data.title && <p className="text-sm font-semibold text-slate-700 mb-3 text-center">{data.title}</p>}
        <Bar data={chartData} options={CHART_OPTIONS} />
      </div>
    );
  }

  // ── LINE CHART ─────────────────────────────────────────────────────────────
  if (data.type === 'line') {
    const chartData = {
      labels: data.labels ?? [],
      datasets: (data.datasets ?? []).map(ds => ({
        label: ds.label,
        data: ds.data,
        borderColor: ds.color,
        backgroundColor: ds.color + '22',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      })),
    };
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        {data.title && <p className="text-sm font-semibold text-slate-700 mb-3 text-center">{data.title}</p>}
        <Line data={chartData} options={CHART_OPTIONS} />
      </div>
    );
  }

  // ── DATA TABLE ─────────────────────────────────────────────────────────────
  if (data.type === 'table') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 overflow-x-auto">
        {data.title && <p className="text-sm font-semibold text-slate-700 mb-3">{data.title}</p>}
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr>
              {(data.headers ?? []).map((h, i) => (
                <th key={i} className="bg-[#0A528A] text-white px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data.rows ?? []).map((row, ri) => (
              <tr key={ri} className={
                data.highlightRow === ri
                  ? 'bg-amber-50 font-bold'
                  : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'
              }>
                {row.map((cell, ci) => (
                  <td key={ci} className={`px-3 py-2 border-b border-slate-100 ${
                    data.highlightCol === ci ? 'font-bold text-[#0A528A]' : ''
                  }`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── READING PASSAGE ────────────────────────────────────────────────────────
  if (data.type === 'passage') {
    return (
      <div className="bg-blue-50 border-l-4 border-[#0A528A] rounded-xl p-4 mb-4">
        {data.title && (
          <p className="text-xs font-bold text-[#0A528A] uppercase tracking-wide mb-2">{data.title}</p>
        )}
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{data.text}</div>
      </div>
    );
  }

  return null;
}
