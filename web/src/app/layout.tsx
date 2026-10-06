import type { Metadata } from 'next';
import React from 'react';

import { AnalyticsPageviewTracker, ErrorBoundary } from '@/components';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { SITE_URL } from '@/lib/site';
import './globals.css';

const SITE_TITLE = 'NEDHub - NED University Teacher Reviews, Past Papers & FAQ';
const SITE_DESCRIPTION =
  'NEDHub helps NED University students find honest teacher reviews, past papers, notes, and answers to common university questions.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | NEDHub',
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'NEDHub',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
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
          <AnalyticsPageviewTracker />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ErrorBoundary>
      </body>
    </html>
  );
}
