import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speaking Coach",
  description: "AI-powered speaking coach to improve your public speaking skills",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
