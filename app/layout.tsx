import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { PWARegistration } from "./components/PWARegistration";

// Using system fonts to avoid Google Fonts download issues
const geistSans = {
  variable: "--font-geist-sans",
  className: "",
};

const geistMono = {
  variable: "--font-geist-mono",
  className: "",
};

export const metadata: Metadata = {
  title: "ILMI LMS",
  description: "Platform pembelajaran ILMI",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/ilmi-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        <PWARegistration />
        <Analytics />
      </body>
    </html>
  );
}
