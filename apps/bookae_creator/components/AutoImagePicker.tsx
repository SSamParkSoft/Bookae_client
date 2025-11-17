'use client'

import { useMemo } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useThemeStore } from '@/store/useThemeStore'
import type { AutoScene } from '@/lib/types/video'
import type { CrawledImageAsset } from '@/lib/data/autoScenes'

interface AutoImagePickerProps {
  assets: CrawledImageAsset[]
  scenes: AutoScene[]
  minSelection?: number
  maxSelection?: number
  onSelectAsset: (asset: CrawledImageAsset) => void
  onRemoveScene: (sceneId: string) => void
  onReorderScenes: (sceneIdsInOrder: string[]) => void
}

const SortableSceneThumbnail = ({
  scene,
  onRemove,
}: {
  scene: AutoScene
  onRemove: (sceneId: string) => void
}) => {
  const theme = useThemeStore((state) => state.theme)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: scene.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative flex items-center gap-3 rounded-xl border p-2 pr-3 text-left ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } ${isDragging ? 'shadow-lg ring-2 ring-purple-400' : ''}`}
    >
      <button
        className="flex h-8 w-6 items-center justify-center text-gray-400"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-purple-200">
        <img src={scene.imageUrl} alt={scene.imageLabel} className="h-full w-full object-cover" />
        <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white shadow-lg">
          {scene.imageLabel ? scene.imageLabel.slice(0, 1) : '컷'}
        </span>
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {scene.imageLabel}
        </p>
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>#{scene.assetId}</p>
      </div>
      <button
        onClick={() => onRemove(scene.id)}
        className="text-gray-400 transition-colors hover:text-red-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function AutoImagePicker({
  assets,
  scenes,
  minSelection = 4,
  maxSelection = 6,
  onSelectAsset,
  onRemoveScene,
  onReorderScenes,
}: AutoImagePickerProps) {
  const theme = useThemeStore((state) => state.theme)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const selectedAssetIds = useMemo(() => new Set(scenes.map((scene) => scene.assetId)), [scenes])
  const canSelectMore = scenes.length < maxSelection
  const hasMinSelection = scenes.length >= minSelection

  const handleCardClick = (asset: CrawledImageAsset) => {
    if (selectedAssetIds.has(asset.id)) {
      const targetScene = scenes.find((scene) => scene.assetId === asset.id)
      if (targetScene) {
        onRemoveScene(targetScene.id)
      }
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
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          1. 이미지 선택 및 순서 설정
        </h3>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          크롤링된 이미지를 선택하면 좌측에서 우측 순서대로 장면이 구성됩니다. 최소 {minSelection}장,
          최대 {maxSelection}장까지 선택할 수 있어요.
        </p>
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          theme === 'dark' ? 'border-gray-700 bg-gray-900/40' : 'border-gray-200 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              선택된 장면 {scenes.length}/{maxSelection}
            </p>
            <p className={`text-xs ${hasMinSelection ? 'text-green-500' : 'text-yellow-500'}`}>
              {hasMinSelection ? '최소 조건을 충족했어요' : `최소 ${minSelection}장 이상 필요해요`}
            </p>
          </div>
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
        </div>

        {scenes.length > 0 && (
          <div className="mt-4 space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={scenes.map((scene) => scene.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex flex-col gap-3">
                  {scenes.map((scene) => (
                    <SortableSceneThumbnail key={scene.id} scene={scene} onRemove={onRemoveScene} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {scenes.length === 0 && (
          <div
            className={`mt-4 rounded-xl border border-dashed p-6 text-center ${
              theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
            }`}
          >
            아직 선택된 장면이 없어요. 아래에서 원하는 이미지를 골라주세요.
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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
              <CardContent className="p-3">
                <div className="relative aspect-square overflow-hidden rounded-xl">
                  <img src={asset.url} alt={asset.label} className="h-full w-full object-cover" />
                  {selected && (
                    <div className="absolute inset-0 bg-black/40">
                      <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-purple-600">
                        선택됨
                      </div>
                    </div>
                  )}
                </div>
                <p
                  className={`mt-3 text-sm font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {asset.label}
                </p>
                <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {asset.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}


