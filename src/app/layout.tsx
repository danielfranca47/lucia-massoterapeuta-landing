import type { Metadata } from "next";
import { Fraunces, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Lúcia — Ritual de Massagem Amazônica | Faro & Olhão",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${fraunces.variable} ${manrope.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
