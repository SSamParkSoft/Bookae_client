'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { PenTool, Bot, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import StepIndicator from '@/components/StepIndicator'
import { useVideoCreateStore } from '@/store/useVideoCreateStore'
import { useThemeStore } from '@/store/useThemeStore'
import ConceptToneDialog from '@/components/ConceptToneDialog'

export default function Step2Page() {
  const router = useRouter()
  const { scriptMethod, setScriptMethod, setIsCreating, setCreationProgress, isCreating, creationProgress } = useVideoCreateStore()
  const theme = useThemeStore((state) => state.theme)
  const [showConceptDialog, setShowConceptDialog] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'edit' | 'auto'>(scriptMethod || 'edit')
  const [hasSelected, setHasSelected] = useState(false)

  const handleMethodChange = (value: string) => {
    const method = value as 'edit' | 'auto'
    setSelectedMethod(method)
    if (method === 'auto') {
      setShowConceptDialog(true)
    }
  }

  const handleStart = () => {
    setScriptMethod(selectedMethod)
    setHasSelected(true)
    
    // AI 생성 시작
    setIsCreating(true)
    setCreationProgress(0)
    
    // 진행률 시뮬레이션
    const interval = setInterval(() => {
      setCreationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsCreating(false)
          // 생성 완료 후 step3로 이동
          setTimeout(() => {
            router.push('/video/create/step3')
          }, 500)
          return 100
        }
        return prev + 2
      })
    }, 100)
  }

  // AI 생성 중 UI
  if (hasSelected && isCreating) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-screen justify-center"
      >
        <div className="flex w-full max-w-[1600px]">
          <StepIndicator />
          <div className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0 flex items-center justify-center">
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <Loader2 className={`w-16 h-16 mx-auto animate-spin ${
                  theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <h1 className={`text-3xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  AI가 영상을 생성하고 있어요
                </h1>
                <p className={`text-lg ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  잠시만 기다려주세요...
                </p>
              </div>

              {/* 진행률 표시 */}
              <div className="space-y-2">
                <div className={`w-full h-3 rounded-full overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <motion.div
                    className={`h-full ${
                      theme === 'dark' ? 'bg-purple-500' : 'bg-purple-600'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${creationProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {creationProgress}% 완료
                </p>
              </div>

              {/* 생성 중 단계 표시 */}
              <div className={`rounded-lg p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
              }`}>
                <div className="space-y-3 text-left">
                  <div className={`flex items-center gap-3 ${
                    creationProgress >= 20 ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      creationProgress >= 20
                        ? theme === 'dark' ? 'bg-green-400' : 'bg-green-600'
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'
                    }`} />
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      대본 생성 중...
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 ${
                    creationProgress >= 50 ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      creationProgress >= 50
                        ? theme === 'dark' ? 'bg-green-400' : 'bg-green-600'
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'
                    }`} />
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      영상 편집 중...
                    </span>
                  </div>
                  <div className={`flex items-center gap-3 ${
                    creationProgress >= 80 ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      creationProgress >= 80
                        ? theme === 'dark' ? 'bg-green-400' : 'bg-green-600'
                        : theme === 'dark' ? 'bg-gray-600' : 'bg-gray-400'
                    }`} />
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      최종 검토 중...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // 선택 UI
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen justify-center"
    >
      <div className="flex w-full max-w-[1600px]">
        <StepIndicator />
        <div className="flex-1 p-4 md:p-8 overflow-y-auto min-w-0">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h1 className={`text-3xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  대본 생성 방법 선택
                </h1>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  UPDATE
                </Badge>
              </div>
              <p className={`mt-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`}>
                AI에게 모두 맡길지, 생성 후 편집할지 선택하세요
              </p>
            </div>

            <RadioGroup value={selectedMethod} onValueChange={handleMethodChange} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 옵션 1: AI로 생성하고 직접 편집 */}
              <Card className={`cursor-pointer transition-all ${
                selectedMethod === 'edit'
                  ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800'
                    : 'border-gray-200 bg-white'
              }`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <RadioGroupItem value="edit" id="edit" className="mt-1" />
                    <PenTool className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`} />
                    <CardTitle className="text-xl">AI로 생성하고, 내가 직접 편집하기</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    AI가 생성한 400자 내외의 상품 리뷰 대본을 직접 확인하고 수정할 수 있어요. 내가 직접 편집한 대본으로 스타일에 맞게 완성하고 싶을 때 선택하세요!
                  </CardDescription>
                </CardContent>
              </Card>

              {/* 옵션 2: AI에게 모두 맡기기 */}
              <Card className={`cursor-pointer transition-all ${
                selectedMethod === 'auto'
                  ? 'border-2 border-teal-500 bg-teal-50 dark:bg-teal-900/20'
                  : theme === 'dark'
                    ? 'border-gray-700 bg-gray-800'
                    : 'border-gray-200 bg-white'
              }`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <RadioGroupItem value="auto" id="auto" className="mt-1" />
                    <Bot className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`} />
                    <CardTitle className="text-xl">AI에게 모두 맡기기</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base mb-4">
                    컨셉과 말투만 선택 해놓으면, AI가 대본을 자동으로 작성하고, 편집 없이 바로 영상에 적용합니다. 빠르게 제작하고 싶을 때 추천해요!
                  </CardDescription>
                  {selectedMethod === 'auto' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        컨셉 바이럴형
                      </Badge>
                      <Badge variant="outline" className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        말투 이걸 나만 모르고 있었네
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConceptDialog(true)}
                        className="ml-auto"
                      >
                        선택 &gt;
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </RadioGroup>

            <div className="flex justify-end mt-8">
              <Button onClick={handleStart} size="lg" className="gap-2">
                <span>시작하기</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConceptToneDialog
        open={showConceptDialog}
        onOpenChange={setShowConceptDialog}
      />
    </motion.div>
  )
}
