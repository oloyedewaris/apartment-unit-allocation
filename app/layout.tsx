import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";

export const metadata: Metadata = {
  title: "Veerge Allocation",
  description: "Apartment allocation system",
  icons: { icon: "/assets/logo.svg" },
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
