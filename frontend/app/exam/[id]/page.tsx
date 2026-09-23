import ExamClient from './ExamClient';

// Static-export placeholder; real ids resolve client-side from the URL path.
export function generateStaticParams() { return [{ id: 'entry' }]; }
export const dynamicParams = true;

export default function Page() {
  return <ExamClient />;
}
