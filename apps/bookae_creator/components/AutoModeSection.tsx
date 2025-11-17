'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'

import AutoImagePicker from '@/components/AutoImagePicker'
import SceneScriptBoard from '@/components/SceneScriptBoard'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/useThemeStore'
import type { AutoScene } from '@/lib/types/video'
import type { ConceptType } from '@/lib/data/templates'
import { conceptOptions, conceptTones } from '@/lib/data/templates'
import {
  crawledImagePool,
  createSceneFromAsset,
  regenerateScenesWithStyle,
  type CrawledImageAsset,
} from '@/lib/data/autoScenes'

interface AutoModeSectionProps {
  conceptId: ConceptType
  toneId: string
  minScenes?: number
  maxScenes?: number
  onComplete: (scenes: AutoScene[]) => void
}

export default function AutoModeSection({
  conceptId,
  toneId,
  minScenes = 4,
  maxScenes = 6,
  onComplete,
}: AutoModeSectionProps) {
  const theme = useThemeStore((state) => state.theme)
  const [scenes, setScenes] = useState<AutoScene[]>([])
  const [isRegenerating, setIsRegenerating] = useState(false)

  useEffect(() => {
    setScenes([])
  }, [conceptId, toneId])

  const conceptLabel = useMemo(
    () => conceptOptions.find((option) => option.id === conceptId)?.label ?? '선택된 컨셉',
    [conceptId],
  )
  const toneLabel = useMemo(
    () => conceptTones[conceptId]?.find((tone) => tone.id === toneId)?.label ?? '선택된 말투',
    [conceptId, toneId],
  )

  const handleSelectAsset = (asset: CrawledImageAsset) => {
    setScenes((prev) => {
      if (prev.some((scene) => scene.assetId === asset.id)) return prev
      const nextScene = createSceneFromAsset(asset, conceptId, toneId, prev.length)
      return [...prev, nextScene]
    })
  }

  const handleRemoveScene = (sceneId: string) => {
    setScenes((prev) => prev.filter((scene) => scene.id !== sceneId))
  }

  const handleReorderScenes = (orderedIds: string[]) => {
    setScenes((prev) => {
      const map = Object.fromEntries(prev.map((scene) => [scene.id, scene]))
      return orderedIds.map((id) => map[id]).filter(Boolean) as AutoScene[]
    })
  }

  const handleSceneChange = (sceneId: string, updates: Partial<AutoScene>) => {
    setScenes((prev) =>
      prev.map((scene) => (scene.id === sceneId ? { ...scene, ...updates } : scene)),
    )
  }

  const handleRegenerateScripts = () => {
    setIsRegenerating(true)
    setTimeout(() => {
      setScenes((prev) => regenerateScenesWithStyle(prev, conceptId, toneId))
      setIsRegenerating(false)
    }, 600)
  }

  const canComplete = scenes.length >= minScenes

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <AutoImagePicker
        assets={crawledImagePool}
        scenes={scenes}
        minSelection={minScenes}
        maxSelection={maxScenes}
        onSelectAsset={handleSelectAsset}
        onRemoveScene={handleRemoveScene}
        onReorderScenes={handleReorderScenes}
      />

      <SceneScriptBoard
        scenes={scenes}
        conceptLabel={conceptLabel}
        toneLabel={toneLabel}
        isRegenerating={isRegenerating}
        minSelection={minScenes}
        onSceneChange={handleSceneChange}
        onRegenerateScripts={handleRegenerateScripts}
      />

      <div
        className={`rounded-2xl border p-4 ${
          theme === 'dark' ? 'border-gray-700 bg-gray-900/60' : 'border-gray-200 bg-gray-50'
        }`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`rounded-full p-2 ${
                theme === 'dark' ? 'bg-gray-800 text-yellow-400' : 'bg-yellow-50 text-yellow-600'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                이미지 선택과 스크립트 수정을 마치면 다음 단계로 이동할 수 있어요.
              </p>
              <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                최소 {minScenes}장 이상 선택해야 하며, 컷 순서는 나중에 STEP3에서도 그대로 활용됩니다.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            disabled={!canComplete}
            onClick={() => onComplete(scenes)}
            className="gap-2"
          >
            다음 단계로 이동
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.section>
  )
}


