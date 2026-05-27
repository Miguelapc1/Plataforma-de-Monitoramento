import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sentinel — Observability Platform',
  description: 'Operational monitoring and observability platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} bg-[#0a0a0f] text-gray-100 antialiased`}>
        {children}
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#111118', color: '#f9fafb', border: '1px solid #1e1e2a' },
        }} />
      </body>
    </html>
  );
}
