'use client';
import AppShell from '../../components/AppShell';
import { usePathname } from 'next/navigation';

export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  // Test runner & sandbox are full-screen candidate surfaces (no app chrome).
  if (path.startsWith('/simulator/test') || path.startsWith('/simulator/sandbox')) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
