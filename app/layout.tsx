import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AppSidebar } from '@/components/app-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'NAEM · EMPLEO ETT SL',
  description:
    'Panel de inteligencia comercial de NAEM: oportunidades de empleo detectadas automáticamente, empresas que contratan y actividad por zona.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`bg-background ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <TooltipProvider>
          <div className="flex min-h-screen">
            <AppSidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </TooltipProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
