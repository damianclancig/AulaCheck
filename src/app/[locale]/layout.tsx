import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/theme/ThemeProvider";
import SessionProviderWrapper from "@/components/auth/SessionProviderWrapper";
import { ModalProvider } from "@/providers/ModalProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'login' });

  return {
    title: {
      template: '%s | AulaCheck',
      default: 'AulaCheck',
    },
    description: t('description'),
    keywords: ["educación", "asistencias", "notas", "software docentes", "app escolar", "passkeys", "biometría"],
    authors: [{ name: 'Damian Clancig' }],
    openGraph: {
      title: "AulaCheck",
      description: t('description'),
      url: "https://aulacheck.clancig.com.ar",
      siteName: "AulaCheck",
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "AulaCheck",
      description: t('description'),
    },
    icons: {
      icon: [
        { url: "/assets/icon.webp?v=2", sizes: "192x192", type: "image/webp" },
        { url: "/assets/icon.webp?v=2", sizes: "512x512", type: "image/webp" },
      ],
      apple: [
        { url: "/assets/icon.webp?v=2", sizes: "180x180", type: "image/webp" },
      ],
    },
    manifest: "/manifest.json?v=2",
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Passing all messages to the client
  // You might want to pass only the necessary messages in larger apps
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <SessionProviderWrapper>
            <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
              <ModalProvider>
                {children}
              </ModalProvider>
            </ThemeProvider>
          </SessionProviderWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
