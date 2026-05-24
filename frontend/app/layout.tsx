import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PsychometricCoach — Ace Your Tests',
  description: 'Adaptive AI-powered psychometric test preparation. Practice 15+ test types, track progress, and boost your score.',
  keywords: 'psychometric test, numerical reasoning, verbal reasoning, abstract reasoning, practice, preparation',
  openGraph: {
    title: 'PsychometricCoach',
    description: 'Adaptive AI-powered psychometric test preparation',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0A528A" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
