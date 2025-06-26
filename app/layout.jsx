'use client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Inter } from 'next/font/google';
import '../styles/globals.scss';
import { SessionProvider } from 'next-auth/react';
const inter = Inter({ subsets: ['latin'] });

{/*export const metadata = {
  title: 'Expense Tracker',
  description: 'Track your expenses with ease',
};
*/}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html >
  );
}
