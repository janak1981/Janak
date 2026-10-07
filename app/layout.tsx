import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Janak — Educator, Researcher & Writer",
  description:
    "The academic portfolio of Janak: teaching, research, writing, and ideas.",
  metadataBase: new URL("https://janak-nine.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <noscript><style>{".reveal { opacity: 1 !important; transform: none !important; }"}</style></noscript>
      </body>
    </html>
  );
}
