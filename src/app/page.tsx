'use client'

import { useAppStore } from '@/store/useAppStore'

export default function HomePage() {
  const { productUrl, setProductUrl } = useAppStore()

  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-6">📦 부캐 상품 자동화 서비스</h1>

      <input
        type="text"
        placeholder="쿠팡 상품 링크를 입력하세요"
        value={productUrl}
        onChange={(e) => setProductUrl(e.target.value)}
        className="border rounded-lg px-4 py-2 w-96"
      />

      <p className="mt-4 text-gray-600 text-sm">현재 입력된 링크: {productUrl || '없음'}</p>
    </main>
  )
}