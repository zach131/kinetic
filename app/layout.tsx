import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // Import our wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kinetic",
  description: "Personal health and performance dashboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kinetic",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-black">
      <body
        className={`${inter.className} h-full text-white antialiased overscroll-none select-none`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
