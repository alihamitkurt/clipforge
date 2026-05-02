import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthGuard from "@/components/AuthGuard";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ClipForge - AI Video Marketplace on Stellar",
  description: "The premier Web3 platform for AI video generation, editing, and trading on the Stellar network.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthGuard>
          <Navbar />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </AuthGuard>
      </body>
    </html>
  );
}
