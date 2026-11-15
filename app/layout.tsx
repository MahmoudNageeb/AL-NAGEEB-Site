import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { MotionChrome } from '@/components/MotionChrome';
import { VisitTracker } from '@/components/VisitTracker';

export const metadata: Metadata = {
  title: 'AL NAGEEB | النجيب — رفيقك الذكي للمذاكرة والتركيز',
  description:
    'الموقع الرسمي لتطبيق النجيب (AL NAGEEB) للأندرويد — مكتبة دراسية مترتبة، سبورة ذكية للشرح والتلخيص، ومؤقت يحمي تركيزك من التشتيت بالكامل من غير نت.',
  openGraph: {
    title: 'AL NAGEEB | النجيب — رفيقك الذكي للمذاكرة والتركيز',
    description:
      'حمّل تطبيق النجيب للأندرويد — نظّم موادك، ركّز في مذاكرتك، وابعد عن المشتتات بخصوصية تامة ومن غير نت.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AL NAGEEB | النجيب — رفيقك الذكي للمذاكرة والتركيز',
    description:
      'الموقع الرسمي لتطبيق النجيب للأندرويد — مكتبة دراسية وسبورة ذكية ومؤقت تركيز شغّال أوفلاين بالكامل.',
  },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      data-scroll-behavior="smooth"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&family=Tajawal:wght@400;500;700&display=swap"
        />
      </head>
      <body
        className="min-h-screen bg-[var(--velvet-bg)] text-[var(--velvet-text)] selection:bg-[#F0C97A]/30 selection:text-[var(--velvet-text)]"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <MotionChrome />
          <VisitTracker />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
