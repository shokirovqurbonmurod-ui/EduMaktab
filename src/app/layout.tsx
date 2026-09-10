import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SchoolOS — Xususiy maktab boshqaruvi",
    template: "%s · SchoolOS",
  },
  description:
    "Xususiy maktab boshqaruvining yangi avlodi. O‘quvchilar, davomat, baholar, moliya va CRM — bitta tizimda.",
  applicationName: "SchoolOS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SchoolOS",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * Apply the persisted theme before first paint (avoids dark-mode flash).
 * Runs synchronously in <head>; no-ops on the server.
 */
const themeScript = `(function(){try{var t=localStorage.getItem('schoolos.theme');var d=false;if(t){d=JSON.parse(t).state.theme==='dark';}if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans min-h-dvh bg-background text-foreground">{children}</body>
    </html>
  );
}
