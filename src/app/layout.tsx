import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bonzo Agentic Concierge",
  description:
    "AI-powered DeFi assistant for Hedera — deposit HBAR into Bonzo vaults via natural language.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-gray-100 font-[var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
