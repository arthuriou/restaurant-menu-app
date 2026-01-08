import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const montserrat = Montserrat({
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Restaurant Menu",
  description: "Digital Menu",
};

import { FirebaseInitializer } from "@/components/firebase-initializer";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${montserrat.variable} font-sans antialiased bg-background text-foreground`}>
        <FirebaseInitializer />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
