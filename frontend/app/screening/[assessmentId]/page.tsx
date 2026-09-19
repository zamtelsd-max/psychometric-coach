import ScreeningClient from './ScreeningClient';

// Static-export placeholder; real ids resolve client-side from the URL.
export function generateStaticParams() { return [{ assessmentId: 'entry' }]; }
export const dynamicParams = true;

export default function Page() {
  return <ScreeningClient />;
}
