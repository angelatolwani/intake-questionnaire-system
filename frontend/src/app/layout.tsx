import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientWrapper from '@/components/ClientWrapper';
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Questionnaire System',
  description: 'A system for managing questionnaires and responses',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientWrapper>
          <main className="min-h-screen">
            {children}
          </main>
        </ClientWrapper>
      </body>
    </html>
  );
}
