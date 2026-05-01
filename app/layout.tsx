import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/lib/auth-context'
import { VisitorProvider } from '@/lib/visitor-context'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ENA - Visitor Management System',
  description: 'Manage visitor appointments and access with ease',
  generator: 'REDWAN',
  icons: {
    icon: [
      {
        url: '/logo2.jpg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/logo2.jpg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/logo2.jpg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/logo2.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body suppressHydrationWarning className="bg-background font-sans antialiased text-foreground">
        <AuthProvider>
          <VisitorProvider>
            {children}
          </VisitorProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}

