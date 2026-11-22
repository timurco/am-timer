import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { INSTALL_SCRIPT } from "@/lib/install";
import { InstallOffer } from "@/components/install-offer";
import { Offline } from "@/components/offline";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["200"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Meditation Timer",
  description: "Simple meditation timer with animated countdown",
  manifest: "/manifest.json",
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Meditation Timer",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: INSTALL_SCRIPT }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${manrope.variable} antialiased`}>
        {children}
        <InstallOffer />
        <Offline />
      </body>
    </html>
  );
}
