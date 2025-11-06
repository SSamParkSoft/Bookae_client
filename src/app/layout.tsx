import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'Bookae Client',
  description: 'AI 기반 부업 자동화 서비스 클라이언트',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}