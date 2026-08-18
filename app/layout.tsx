import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Volta SKAI Allocation",
  description: "Explore apartments, floor plans, and interiors at Volta SKAI.",
  icons: { icon: "/assets/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
