import type { Metadata } from 'next';
import { Storefront } from '@/components/Storefront';

export const metadata: Metadata = { title: 'Free to watch' };

export default function FreePage() {
  return <Storefront page="free" heading="Free to watch" />;
}
