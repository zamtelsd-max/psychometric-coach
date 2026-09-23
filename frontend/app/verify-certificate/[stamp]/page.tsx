import VerifyClient from './VerifyClient';

export function generateStaticParams() { return [{ stamp: 'entry' }]; }
export const dynamicParams = true;

export default function Page() {
  return <VerifyClient />;
}
