import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Chrome } from '@/components/layout/Chrome';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AvailMed - Find Medicines Near You',
  description: 'Search for medicines and find pharmacies near you instantly. Reserve medicines online.',
  keywords: 'medicine, pharmacy, healthcare, drug store, medicine availability',
  openGraph: {
    title: 'AvailMed - Find Medicines Near You',
    description: 'Search for medicines and find pharmacies near you instantly.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-950 min-h-screen flex flex-col`}>
        <Providers>
          <Chrome>{children}</Chrome>
        </Providers>
      </body>
    </html>
  );
}
