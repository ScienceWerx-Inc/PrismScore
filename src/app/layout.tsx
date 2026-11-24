import type { Metadata } from 'next';
import { Manrope, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

// Body and UI text
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PrismScore | Enterprise AI Literacy & Leadership Alignment by ScienceWerx',
  description:
    'A free 25-question assessment that scores your company’s AI readiness out of 500, reveals leadership alignment and adoption risks, and shows what to fix first.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${plexMono.variable}`}
    >
      <body className={`${manrope.className} min-h-screen flex flex-col text-ink antialiased selection:bg-prism-600 selection:text-white`}>
        <SiteHeader />

        <main className="flex-1 flex flex-col">{children}</main>

        <SiteFooter />
      </body>
    </html>
  );
}
