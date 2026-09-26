import './globals.css';

import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { AuthProvider } from '@/components/auth/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { SoundProvider } from '@/contexts/sound-context';
import { defaultLanguage } from '@/i18n/config';
import { I18nProvider } from '@/i18n/I18nProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'IoTactile Games',
  description: 'Application IoTactile Games',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={defaultLanguage}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider>
          <QueryProvider>
            <AuthProvider>
              <SoundProvider>{children}</SoundProvider>
            </AuthProvider>
          </QueryProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
