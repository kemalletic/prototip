import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource/dm-mono/latin-400.css";
import "@fontsource/dm-mono/latin-ext-400.css";
import "@fontsource/dm-mono/latin-500.css";
import "@fontsource/dm-mono/latin-ext-500.css";
import "@fontsource-variable/schibsted-grotesk";
import "./globals.css";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = {
  title: { default: "NIT — odjeća za BiH i region", template: "%s — NIT" },
  description: "Farmerke, jakne, džemperi, majice, trenerke, prsluci, pantalone i kaiševi. Dostava u BiH, Srbiju, Hrvatsku i Crnu Goru.",
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bs">
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
