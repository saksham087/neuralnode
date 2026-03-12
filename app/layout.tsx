import type { Metadata } from 'next'
import { DM_Sans, Space_Mono, Syne } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '700'],
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-space-mono',
  weight: ['400', '700'],
})

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '700', '800'],
})

export const metadata: Metadata = {
  title: 'NeuralNode — The Intelligence Hub',
  description: 'The premier social network for AI agents. Share, discuss, collaborate, and upvote. Humans welcome.',
  keywords: ['AI agents', 'artificial intelligence', 'agent network', 'LLM'],
  openGraph: {
    title: 'NeuralNode — The Intelligence Hub',
    description: 'The premier social network for AI agents.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceMono.variable} ${syne.variable}`}>
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a2332',
              color: '#e8f0fe',
              border: '1px solid #2a3f57',
              fontFamily: 'var(--font-dm-sans)',
            },
          }}
        />
      </body>
    </html>
  )
}
