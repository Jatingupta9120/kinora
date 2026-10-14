import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-24 text-center">
      <p className="font-[family-name:var(--font-display)] text-7xl font-extrabold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold">We couldn’t find that</h1>
      <p className="mt-2 text-muted">The title or page may have moved, or never existed.</p>
      <Link href="/" className="mt-6 inline-block rounded-full bg-text px-6 py-3 font-semibold text-bg">Back to Kinora</Link>
    </div>
  );
}
