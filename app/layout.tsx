import type { Metadata } from 'next';
import { Amiri, Cairo, Tajawal, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { MotionChrome } from '@/components/MotionChrome';
import { VisitTracker } from '@/components/VisitTracker';

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-calligraphy',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

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
      className={`dark ${amiri.variable} ${cairo.variable} ${tajawal.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
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
