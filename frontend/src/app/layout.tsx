'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  return (
    <html lang="fr" className="h-full">
      <head>
        <title>VSN-CI Mobile Money</title>
        <meta name="description" content="Plateforme de gestion Mobile Money VSN-CI" />
      </head>
      <body className={`${inter.className} h-full bg-[#f8f9fa]`} suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster richColors position="top-right" />
        </QueryClientProvider>
      </body>
    </html>
  );
}
