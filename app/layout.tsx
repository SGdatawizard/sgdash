import type { Metadata } from 'next';
import { Playfair_Display, Inter, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});
const body = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-body',
});
const data = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-data',
});

export const metadata: Metadata = {
  title: 'Stanley Gibbons | KPI Dashboard',
  description: 'C-suite KPI tracking dashboard for Stanley Gibbons Auctions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${data.variable}`}>
      <body className="font-body bg-canvas text-ink antialiased">{children}</body>
    </html>
  );
}
