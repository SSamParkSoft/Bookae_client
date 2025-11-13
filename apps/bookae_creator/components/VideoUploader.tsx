'use client'

import { useState, useRef } from 'react'
import { Upload, Video, X, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useThemeStore } from '@/store/useThemeStore'

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void
  maxSizeMB?: number
  acceptedFormats?: string[]
}

export default function VideoUploader({
  onVideoSelect,
  maxSizeMB = 500,
  acceptedFormats = ['video/mp4', 'video/mov', 'video/avi', 'video/quicktime'],
}: VideoUploaderProps) {
  const theme = useThemeStore((state) => state.theme)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    setError(null)

    // 파일 형식 검사
    if (!acceptedFormats.includes(file.type)) {
      setError(`지원하지 않는 파일 형식입니다. 지원 형식: ${acceptedFormats.join(', ')}`)
      return
    }

    // 파일 크기 검사
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      setError(`파일 크기가 너무 큽니다. 최대 ${maxSizeMB}MB까지 업로드 가능합니다.`)
      return
    }

    setSelectedFile(file)
    onVideoSelect(file)

    // 미리보기 URL 생성
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`text-lg font-semibold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          영상 업로드
        </h3>
        <p className={`text-sm ${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          촬영한 영상 파일을 업로드해주세요 (최대 {maxSizeMB}MB)
        </p>
      </div>

      {!selectedFile ? (
        <Card
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed transition-colors ${
            theme === 'dark'
              ? 'border-gray-700 hover:border-gray-600 bg-gray-800'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
              }`}>
                <Upload className={`w-8 h-8 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </div>
              <div className="text-center">
                <p className={`font-medium mb-1 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  영상 파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  MP4, MOV, AVI 형식 지원
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileInputChange}
                className="hidden"
                id="video-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-4"
              >
                <Video className="w-4 h-4 mr-2" />
                파일 선택
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {selectedFile.name}
                    </p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  className="text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {previewUrl && (
                <div className="mt-4">
                  <video
                    src={previewUrl}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className={`p-4 rounded-lg ${
          theme === 'dark'
            ? 'bg-red-900/20 border border-red-700'
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}>
            {error}
          </p>
        </div>
      )}
    </div>
  )
}

