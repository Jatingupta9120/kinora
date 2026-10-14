import type { Metadata } from 'next';
import { Storefront } from '@/components/Storefront';

export const metadata: Metadata = { title: 'Movies' };

export default function MoviesPage() {
  return <Storefront page="movies" heading="Movies" />;
}
