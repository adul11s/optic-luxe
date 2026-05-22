import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Optic Luxe | Premium Eyewear",
  description: "Discover premium eyewear that defines your style. Shop the finest collection of frames and sunglasses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-brand-50 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}