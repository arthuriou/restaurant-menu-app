import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
 import { ThemeProvider } from "@/components/theme-provider";
 import { Toaster } from "@/components/ui/sonner";
 import { ThemeInitializer } from "@/components/theme-initializer";

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
import { ClientOrderListener } from "@/components/client-order-listener";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${montserrat.variable} font-sans antialiased`}
      >
        <ThemeProvider>
          <ThemeInitializer />
          <FirebaseInitializer />
          <ClientOrderListener />
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
