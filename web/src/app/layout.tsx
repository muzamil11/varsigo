import type { Metadata } from 'next';
import React from 'react';

import { ErrorBoundary } from '@/components';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'NEDHub - NED University Teacher Reviews, Past Papers & FAQ',
    template: '%s | NEDHub',
  },
  description:
    'NEDHub helps NED University students find honest teacher reviews, past papers, notes, and answers to common university questions.',
};

const THEME_SCRIPT = `(function(){try{var raw=localStorage.getItem('varsigo-theme');var theme=raw?JSON.parse(raw).state.theme:'dark';if(theme==='dark')document.documentElement.classList.add('dark');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body
        className="flex min-h-screen flex-col bg-background antialiased dark:bg-background-dark"
        suppressHydrationWarning
      >
        <ErrorBoundary>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
