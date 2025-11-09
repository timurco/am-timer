import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meditation Timer",
  description: "Simple meditation timer with animated countdown",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
