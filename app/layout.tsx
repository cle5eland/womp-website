import type { Metadata, Viewport } from "next";
import { Bebas_Neue, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { MotionProviders } from "@/components/motion-providers";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const ibmMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "womp",
    template: "%s · womp",
  },
  description: "womp — dubstep producer & DJ. Shows, music, and press kit.",
  icons: {
    icon: "/assets/mascot_white.png",
    shortcut: "/assets/mascot_white.png",
    apple: "/assets/mascot_white.png",
  },
  openGraph: {
    title: "womp",
    description: "Dubstep producer & DJ — Seattle.",
    url: "https://djwomp.com/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bebas.variable} ${ibmMono.variable} ${ibmMono.className} antialiased`}
      >
        <MotionProviders>{children}</MotionProviders>
      </body>
    </html>
  );
}
