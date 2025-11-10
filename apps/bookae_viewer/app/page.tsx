'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { extractVideoId } from '@/lib/utils/videoId'

export default function ViewerHomePage() {
  const searchParams = useSearchParams()
  
  // videoID 추출 (useMemo로 최적화)
  const { videoId, referer, source } = useMemo(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : null
    const currentReferer = typeof window !== 'undefined' ? document.referrer : null

    const result = extractVideoId(searchParams, currentUrl, currentReferer)

    // 디버깅용 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log('Current URL:', currentUrl)
      console.log('Referer:', currentReferer)
      console.log('Extracted videoID:', result.videoId)
      console.log('Source:', result.source)
    }

    return {
      videoId: result.videoId,
      referer: currentReferer,
      source: result.source,
    }
  }, [searchParams])

  // TODO: videoID를 사용하여 영상 데이터 로드
  // useEffect(() => {
  //   if (videoId) {
  //     fetchVideoData(videoId)
  //   }
  // }, [videoId])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      {/* 로고 */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">📦 Bookae</h1>
      </div>

      {/* 로딩 스피너 */}
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-600 text-lg">로딩 중...</p>
      </div>

      {/* 디버깅 정보 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-12 p-4 bg-white rounded-lg shadow-sm border border-gray-200 text-sm text-gray-600 max-w-md">
          <div className="space-y-2">
            <div>
              <strong>VideoID:</strong> {videoId || '없음'}
            </div>
            <div>
              <strong>Source:</strong> {source || '없음'}
            </div>
            <div>
              <strong>Referer:</strong> {referer || '없음'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

