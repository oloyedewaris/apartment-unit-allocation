import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Myxellia",
  description: "Explore apartments, floor plans, and interiors at Myxellia.",
  icons: { icon: "/assets/logo.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
