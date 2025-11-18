import './globals.css';
import type { ReactNode } from 'react';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export const metadata = {
  title: 'Coastal Vision Realty',
  description: 'Beautiful homes by the coast. Friendly guidance.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main className="container py-10 min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}