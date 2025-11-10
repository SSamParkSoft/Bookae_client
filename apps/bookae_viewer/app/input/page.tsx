'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractVideoId, getYouTubeVideoId } from '@/lib/utils/videoId'
import { Loader2, ExternalLink } from 'lucide-react'

export default function InputPage() {
  const router = useRouter()
  const [inputUrl, setInputUrl] = useState('')
  const [extractedVideoId, setExtractedVideoId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExtract = () => {
    if (!inputUrl.trim()) {
      setError('URL을 입력해주세요.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // YouTube URL에서 video ID 추출
      const videoId = getYouTubeVideoId(inputUrl)
      
      if (videoId) {
        setExtractedVideoId(videoId)
      } else {
        // 일반 URL에서 videoID 파라미터 확인
        try {
          const url = new URL(inputUrl)
          const videoIdFromParam = url.searchParams.get('videoID') || url.searchParams.get('videoId')
          if (videoIdFromParam) {
            setExtractedVideoId(videoIdFromParam)
          } else {
            setError('URL에서 videoID를 찾을 수 없습니다.')
            setExtractedVideoId(null)
          }
        } catch {
          setError('유효하지 않은 URL 형식입니다.')
          setExtractedVideoId(null)
        }
      }
    } catch (err) {
      setError('URL 처리 중 오류가 발생했습니다.')
      setExtractedVideoId(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleView = () => {
    if (extractedVideoId) {
      // 메인 페이지로 이동하면서 videoID 전달
      router.push(`/?videoID=${extractedVideoId}`)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleExtract()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="w-full max-w-2xl">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📦 Bookae</h1>
          <p className="text-gray-600">Video ID 추출기</p>
        </div>

        {/* 입력 폼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL 입력
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value)
                  setError(null)
                  setExtractedVideoId(null)
                }}
                onKeyPress={handleKeyPress}
                placeholder="https://www.youtube.com/watch?v=nKpZFe-fx2Q 또는 https://example.com?videoID=123"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleExtract}
                disabled={isLoading || !inputUrl.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>추출 중...</span>
                  </>
                ) : (
                  <span>추출</span>
                )}
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 추출된 Video ID */}
          {extractedVideoId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-800 mb-1">
                    추출된 Video ID:
                  </div>
                  <div className="text-lg font-mono text-green-900">
                    {extractedVideoId}
                  </div>
                </div>
                <button
                  onClick={handleView}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>보기</span>
                </button>
              </div>
            </div>
          )}

          {/* 예시 */}
          <div className="pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 mb-2">지원되는 URL 형식:</div>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>YouTube: https://www.youtube.com/watch?v=nKpZFe-fx2Q</li>
              <li>YouTube 짧은 링크: https://youtu.be/nKpZFe-fx2Q</li>
              <li>일반 URL: https://example.com?videoID=123</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

