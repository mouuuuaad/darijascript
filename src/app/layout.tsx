import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DarijaScript IDE',
  description: 'A simple IDE for the DarijaScript programming language.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Apply font variables to the html tag for better global scope
    // Add suppressHydrationWarning to potentially resolve font/style hydration issues
    <html lang="en" className={cn(geistSans.variable, geistMono.variable)} suppressHydrationWarning>
      {/* Keep antialiased, font variables applied via html tag and globals.css */}
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
