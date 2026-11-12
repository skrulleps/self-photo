import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Fredoka } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

const description = "Pilih frame, jepret, lalu simpan foto lucu langsung dari browser.";

// WhatsApp butuh alamat gambar preview yang lengkap. SITE_URL diisi di pengaturan build Cloudflare,
// CF_PAGES_URL otomatis ada di build preview Cloudflare.
const siteUrl = process.env.SITE_URL ?? process.env.CF_PAGES_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Studio Jepret",
  description,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "Studio Jepret",
    title: "Studio Jepret",
    description,
  },
  twitter: { card: "summary_large_image" },
};

// viewportFit cover: konten boleh sampai ke tepi layar berponi, jaraknya diatur .safe-area
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fff3f8" },
    { media: "(prefers-color-scheme: dark)", color: "#2a1f33" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
