'use client'

import { useMemo } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/useThemeStore'
import type { AutoScene } from '@/lib/types/video'
import type { CrawledImageAsset } from '@/lib/data/autoScenes'

interface SceneStatus {
  state: 'idle' | 'loading' | 'ready'
  progress: number
  stage: number
}

interface AutoImagePickerProps {
  assets: CrawledImageAsset[]
  scenes: AutoScene[]
  minSelection?: number
  maxSelection?: number
  sceneStatuses: Record<string, SceneStatus>
  loadingStages: string[]
  onSelectAsset: (asset: CrawledImageAsset) => void
  onRemoveScene: (sceneId: string) => void
  onReorderScenes: (sceneIdsInOrder: string[]) => void
  onConfirmAllScenes: () => void
}

const SortableSceneThumbnail = ({
  scene,
  status,
  stages,
  onRemove,
}: {
  scene: AutoScene
  status: SceneStatus
  stages: string[]
  onRemove: (sceneId: string) => void
}) => {
  const theme = useThemeStore((state) => state.theme)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex items-center gap-3 rounded-xl border p-2 pr-3 text-left ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${isDragging ? 'shadow-lg ring-2 ring-purple-400' : ''}`}
    >
      <button className="flex h-8 w-6 items-center justify-center text-gray-400" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-purple-200">
        <img src={scene.imageUrl} alt={scene.imageLabel} className="h-full w-full object-cover" />
        <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white shadow-lg">
          {scene.imageLabel ? scene.imageLabel.slice(0, 1) : '컷'}
        </span>
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{scene.imageLabel}</p>
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>#{scene.assetId}</p>
        {status.state === 'ready' && <p className="text-xs font-semibold text-green-500">대본 생성 완료</p>}
        {status.state === 'loading' && (
          <div className="mt-1 text-xs text-purple-400">
            {stages[status.stage] ?? stages[stages.length - 1]} · {Math.round(status.progress)}%
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {status.state === 'loading' && (
          <div className="flex items-center gap-2 text-purple-400">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.3" />
              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        )}
        <button onClick={() => onRemove(scene.id)} className="text-gray-400 transition-colors hover:text-red-500">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default function AutoImagePicker({
  assets,
  scenes,
  minSelection = 5,
  maxSelection,
  sceneStatuses,
  loadingStages,
  onSelectAsset,
  onRemoveScene,
  onReorderScenes,
  onConfirmAllScenes,
}: AutoImagePickerProps) {
  const theme = useThemeStore((state) => state.theme)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const selectedAssetIds = useMemo(() => new Set(scenes.map((scene) => scene.assetId)), [scenes])
  const selectionLimit = typeof maxSelection === 'number' ? maxSelection : null
  const canSelectMore = selectionLimit ? scenes.length < selectionLimit : true
  const hasMinSelection = scenes.length >= minSelection
  const idleSceneCount = scenes.filter((scene) => (sceneStatuses[scene.id]?.state ?? 'idle') === 'idle').length

  const handleCardClick = (asset: CrawledImageAsset) => {
    if (selectedAssetIds.has(asset.id)) {
      const targetScene = scenes.find((scene) => scene.assetId === asset.id)
      if (targetScene) onRemoveScene(targetScene.id)
      return
    }
    if (!canSelectMore) return
    onSelectAsset(asset)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = scenes.findIndex((scene) => scene.id === active.id)
    const newIndex = scenes.findIndex((scene) => scene.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(scenes, oldIndex, newIndex)
    onReorderScenes(reordered.map((scene) => scene.id))
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>1. 이미지 선택 및 순서 설정</h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          크롤링된 이미지를 선택하면 좌측에서 우측 순서대로 장면이 구성됩니다. 최소 {minSelection}장 이상 선택해주세요
          {selectionLimit ? ` (최대 ${selectionLimit}장).` : '.'}
        </p>
      </div>

      <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-white'}`}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              선택된 장면 {scenes.length}
            </p>
            <p className={`text-xs ${hasMinSelection ? 'text-green-500' : 'text-yellow-500'}`}>
              {hasMinSelection ? '최소 조건을 충족했어요' : `최소 ${minSelection}장 이상 필요해요`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="secondary"
              className={
                hasMinSelection
                  ? 'bg-green-500 text-white'
                  : theme === 'dark'
                    ? 'bg-gray-800 text-gray-300'
                    : 'bg-gray-200 text-gray-600'
              }
            >
              {scenes.length} Scene
            </Badge>
            <Button variant="outline" size="sm" disabled={idleSceneCount === 0} onClick={onConfirmAllScenes}>
              이 사진들로 진행하기
            </Button>
          </div>
        </div>
        <p className={`mt-2 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
          버튼을 누르면 아직 분석하지 않은 장면에 대해 AI 추천 대본이 한 번에 생성돼요.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {assets.map((asset) => {
          const selected = selectedAssetIds.has(asset.id)
          const disabled = !selected && !canSelectMore

          return (
            <Card
              key={asset.id}
              onClick={() => handleCardClick(asset)}
              className={`cursor-pointer transition-all ${
                selected
                  ? 'border-2 border-purple-500 shadow-lg'
                  : disabled
                    ? 'opacity-50'
                    : theme === 'dark'
                      ? 'border-gray-700 hover:border-gray-600'
                      : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CardContent className="p-2">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={asset.url} alt={asset.label} className="h-full w-full object-cover" />
                  {selected && (
                    <div className="absolute inset-0 bg-black/40">
                      <div className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                        선택됨
                      </div>
                    </div>
                  )}
                </div>
                <p className={`mt-2 text-xs font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{asset.label}</p>
                <p className={`text-[11px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{asset.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {scenes.length > 0 ? (
        <div className={`rounded-2xl border p-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-900/40' : 'border-gray-100 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
            <h4 className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>선택된 장면 순서</h4>
            <p className="text-xs text-gray-500">드래그해서 순서를 조정할 수 있어요</p>
          </div>
          <div className="mt-4 space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={scenes.map((scene) => scene.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {scenes.map((scene) => (
                    <SortableSceneThumbnail
                      key={scene.id}
                      scene={scene}
                      status={sceneStatuses[scene.id] ?? { state: 'idle', progress: 0, stage: 0 }}
                      stages={loadingStages}
                      onRemove={onRemoveScene}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-xl border border-dashed p-6 text-center ${
            theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
          }`}
        >
          아직 선택된 장면이 없어요. 위의 이미지에서 마음에 드는 사진을 골라 추가해주세요.
        </div>
      )}
    </div>
  )
}

