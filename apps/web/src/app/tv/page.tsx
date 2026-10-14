import type { Metadata } from 'next';
import { Storefront } from '@/components/Storefront';

export const metadata: Metadata = { title: 'Series' };

export default function TvPage() {
  return <Storefront page="tv" heading="Series" />;
}
