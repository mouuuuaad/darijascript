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
    <html lang="en" className={cn(geistSans.variable, geistMono.variable)}>
      {/* Keep antialiased, font set in CSS */}
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
