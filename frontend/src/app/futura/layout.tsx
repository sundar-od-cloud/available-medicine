import type { Metadata } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import './futura.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Futura Corporate Interiors — Bringing Excellence To Every Workspace',
  description:
    'Since 1996, Futura Corporate Interiors has transformed workspaces across India through thoughtful design, turnkey execution and precision manufacturing.',
};

export default function FuturaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${poppins.variable} futura-root`}>{children}</div>
  );
}
