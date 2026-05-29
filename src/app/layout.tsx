import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeuroEng — AI English Speaking Coach",
  description:
    "Master English speaking with AI-powered conversations, 100+ curated YouTube channels, OPIc preparation, and personalized learning paths. Start free today.",
  keywords: ["English speaking", "OPIc", "AI conversation", "English learning", "TOEIC speaking"],
  openGraph: {
    title: "NeuroEng — AI English Speaking Coach",
    description: "Master English speaking with AI-powered conversations and curated content.",
    type: "website",
    siteName: "NeuroEng",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased" style={{ fontFamily: "var(--font-sans)" }}>
        {children}
      </body>
    </html>
  );
}
