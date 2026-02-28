import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Lexis — Morpheme & Grammar Analyzer',
  description: 'See language, structurally. Break down sentences into parts of speech and morphological components.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSerifDisplay.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'font-sans',
          }}
        />
      </body>
    </html>
  );
}
