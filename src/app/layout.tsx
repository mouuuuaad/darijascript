
import type {Metadata} from 'next';
import {Geist, Geist_Mono} from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/contexts/auth-context'; // Import AuthProvider
import { QueryClientProviderWrapper } from '@/contexts/query-client-provider'; // Import Query Client Wrapper


const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DarijaScript IDE — Code b Darija!',
  description:
    'IDE 9wi w sahl f isti3mal, mkhass b DarijaScript — logha li katkhlli l programming b darija sbab dyal creativity w learning!',
  keywords: [
    'DarijaScript',
    'IDE',
    'Programming b Darija',
    'Learn to code in Arabic',
    'Darija Coding',
    'Simple IDE',
    'Made in Morocco',
  ],
  authors: [
    { name: 'MOUAAD IDOUFKIR', url: 'https://github.com/mouuuuaad' },
  ],
  openGraph: {
    title: 'DarijaScript IDE',
    description: 'Code b Darija. T3allem programming blkhef! | Created by Mouaad Idoufkir',
    url: '', // bddl l link ila 3andk
    siteName: 'DarijaScript IDE',
    images: [
      {
        url: 'https://i.ibb.co/6VCTh2G/DS.png',
        width: 1200,
        height: 630,
        alt: 'DarijaScript IDE Preview',
      },
    ],
    locale: 'ma_AR',
    type: 'website',
  },
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
      {/* Add suppressHydrationWarning to body as well */}
      <body className="antialiased" suppressHydrationWarning>
         <QueryClientProviderWrapper>
             <AuthProvider> {/* Wrap children with AuthProvider */}
                 {children}
                 <Toaster />
             </AuthProvider>
         </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
