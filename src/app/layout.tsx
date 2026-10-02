import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import "./globals.css";

/** Display face: names, levels, titles. Only used at sizes where it stays legible. */
const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

/** Body face: a pixel font that is still readable at 13-16px on a phone. */
const bodyFont = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixel-body",
});

export const metadata: Metadata = {
  title: "Pixel Pet",
  description: "Raise your own 8-bit puppy.",
  appleWebApp: { capable: true, title: "Pixel Pet", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e6ebf0" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1318" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixelFont.variable} ${bodyFont.variable}`}>
      <body className="min-h-[100dvh]">{children}</body>
    </html>
  );
}
