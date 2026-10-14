import type { Metadata } from 'next';
import { Fraunces, Geist } from 'next/font/google';
import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const display = Fraunces({ variable: '--font-display', subsets: ['latin'], weight: ['600', '800'] });

export const metadata: Metadata = {
  title: { default: 'Kinora', template: '%s · Kinora' },
  description: 'Kinora: an original streaming-catalog prototype.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${display.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
