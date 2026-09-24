import React from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: ["400"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TheNST | National Security Think Tank & Capability Network",
  description:
    "A national security institution built around people, knowledge, organisations and opportunity. Serious learning, clear analysis and professional connection.",
  openGraph: {
    title: "TheNST | National Security Think Tank & Capability Network",
    description:
      "A national security institution built around people, knowledge, organisations and opportunity.",
    url: "https://thenst.co",
    siteName: "TheNST",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TheNST | National Security Think Tank",
    description:
      "A national security institution built around people, knowledge, organisations and opportunity.",
  },
};

export const viewport: Viewport = {
  themeColor: "#171b22",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-[#f7f6f2] text-[#171b22] selection:bg-[#d95325]/20 selection:text-[#d95325] overflow-x-hidden min-h-screen flex flex-col">
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

