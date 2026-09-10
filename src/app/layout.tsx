import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/auth-provider";
import { SiteLayout } from "@/components/layout";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Shopsphere",
  description:
    "Shopsphere — everything you need, from electronics to everyday essentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <SiteLayout>{children}</SiteLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}