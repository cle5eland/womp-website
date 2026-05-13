import type { Metadata } from "next";
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
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "womp — EPK",
  description:
    "Electronic press kit — womp. Dubstep producer & DJ. Seattle. Releases, live, press, and booking.",
  openGraph: {
    title: "womp — EPK",
    description: "Dubstep producer & DJ — press, streaming, and booking.",
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
