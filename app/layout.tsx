import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoinTrack",
  description: "Intelligent Personal Finance Management",
};

import { ThemeProvider } from "@/components/theme-provider";
import StyledComponentsRegistry from "@/lib/registry";
import { LenisProvider } from "@/components/lenis-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <StyledComponentsRegistry>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
          >
            <LenisProvider>
              <AuthProvider>{children}</AuthProvider>
            </LenisProvider>
          </ThemeProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
