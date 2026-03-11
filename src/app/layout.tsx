import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "AulaCheck",
  description: "Gestión inteligente de asistencias y calificaciones",
  icons: {
    icon: "/assets/icon.webp",
    apple: "/assets/icon.webp",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderWrapper>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <ModalProvider>
              {children}
            </ModalProvider>
          </ThemeProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
