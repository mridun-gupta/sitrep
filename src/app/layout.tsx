import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex-sans',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: {
    default: 'SITREP — Real-time global intelligence',
    template: '%s · SITREP',
  },
  description:
    'Open-source situational awareness: live conflict, disaster, humanitarian and ' +
    'news intelligence on one operations console. Free public API + MCP server.',
  keywords: ['osint', 'situational awareness', 'geopolitics', 'dashboard', 'open source'],
  openGraph: {
    title: 'SITREP — Real-time global intelligence',
    description:
      'Live conflict, disaster, humanitarian and news intelligence on one open-source console.',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#07090d',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
