import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Serif, Mona_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'
import Navbar from "@/components/ui/Navbar";

const ibmPlexSerif = IBM_Plex_Serif({
  variable : "--font-ibm-plex-serif",
  subsets : ['latin'],
  weight : ['400', '500', '600' , '700'],
  display:'swap'
})


const monaSans = Mona_Sans({
  variable:'--fons-mona-sans',
  subsets: ['latin'],
  display:'swap'
})

export const metadata: Metadata = {
  title: "AI BOOK",
  description: "Transform your books into interactive AI conversations. Upload PDF and chat with your books",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${ibmPlexSerif.variable} ${monaSans.variable} relative antialiased`}
      >
        <ClerkProvider>
        <Navbar />

          {children}
          </ClerkProvider>
      </body>
    </html>
  );
}
