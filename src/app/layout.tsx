import type { Metadata } from 'next';
import { Baloo_2, Nunito } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Configure Baloo font
const baloo = Baloo_2({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-baloo',
});

// Configure Nunito font
const nunito = Nunito({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-nunito',
});

export const metadata: Metadata = {
  title: 'Saffron File Upload',
  description: 'Secure file upload application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${baloo.variable} ${nunito.variable} font-nunito antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
