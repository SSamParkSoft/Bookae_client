import type { ConceptType } from './templates'
import { conceptOptions, conceptTones } from './templates'
import type { AutoScene, SceneLayout } from '@/lib/types/video'

export interface CrawledImageAsset {
  id: string
  url: string
  label: string
  description: string
}

export const crawledImagePool: CrawledImageAsset[] = [
  {
    id: 'vitc-1',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80',
    label: '비타민C 세럼 정면샷',
    description: '맑은 옐로우 빛 유리병과 스포이드가 돋보이는 대표컷',
  },
  {
    id: 'vitc-2',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=60',
    label: '세럼 디테일샷',
    description: '광택이 살아있는 병 디자인과 레이블 문구를 가까이 보여주는 컷',
  },
  {
    id: 'vitc-3',
    url: 'https://images.unsplash.com/photo-1612831662375-295c1003d3ca?auto=format&fit=crop&w=600&q=80',
    label: '스포이드 사용컷',
    description: '스포이드가 세럼을 떨어뜨리는 모습을 담아 제형을 강조',
  },
  {
    id: 'vitc-4',
    url: 'https://images.unsplash.com/photo-1612810806695-30f7a8258399?auto=format&fit=crop&w=600&q=80',
    label: '텍스처 클로즈업',
    description: '세럼 질감과 점도를 한눈에 보여주는 배경컷',
  },
  {
    id: 'vitc-5',
    url: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?auto=format&fit=crop&w=600&q=80',
    label: '사용 컷(손등)',
    description: '손등에 세럼을 펴바르는 모습을 통해 사용감을 전달',
  },
  {
    id: 'vitc-6',
    url: 'https://images.unsplash.com/photo-1612810806800-9d1ad8b3c0a8?auto=format&fit=crop&w=600&q=80',
    label: '피부 전후 비교',
    description: '피부가 맑아지는 과정을 상상하게 하는 슬로건용 이미지',
  },
  {
    id: 'vitc-7',
    url: 'https://images.unsplash.com/photo-1612810806683-3fa63cf62ca1?auto=format&fit=crop&w=600&q=80',
    label: '제품 구성 컷',
    description: '제품 박스와 세럼을 함께 배치해 패키지를 강조',
  },
  {
    id: 'vitc-8',
    url: 'https://images.unsplash.com/photo-1612817158181-8a38f6c3096e?auto=format&fit=crop&w=600&q=80',
    label: '성분 설명 컷',
    description: '주요 성분 표기 라벨을 확대해 신뢰감을 주는 이미지',
  },
  {
    id: 'vitc-9',
    url: 'https://images.unsplash.com/photo-1612831455359-c4adf7b5d8bb?auto=format&fit=crop&w=600&q=80',
    label: '제품과 과일 소품',
    description: '비타민C를 연상시키는 과일과 함께 촬영한 감성 컷',
  },
  {
    id: 'vitc-10',
    url: 'https://images.unsplash.com/photo-1612831200143-f0d7b0d4c7b9?auto=format&fit=crop&w=600&q=80',
    label: '텍스트 정보 컷',
    description: '제품 정보 텍스트를 그대로 보여줘 디테일을 전달',
  },
]

const toneCopyPresets: Record<
  string,
  { opener: string; benefit: string; cta: string }
> = {
  'viral-1': {
    opener: '이걸 이제야 알았다니!',
    benefit: '한 번 쓰면 주변에 자랑하고 싶어지는 밝기 업그레이드',
    cta: '당장 장바구니에 담아야 할 이유 충분하죠?',
  },
  'info-1': {
    opener: '피부를 맑게 밝혀줄 핵심 포인트입니다.',
    benefit: '임상 테스트로 입증된 비타민C 30,150ppm의 탄탄한 효능',
    cta: '하루 한 번 루틴에 추가하면 확실한 변화를 느낄 수 있어요.',
  },
  'daily-1': {
    opener: '하루 한 번, 세럼 한 방울이면',
    benefit: '칙칙했던 피부가 은은하게 환해지는 걸 직접 확인했어요.',
    cta: '꾸준히 쓰기 딱 좋은 가벼운 제형이라 더 마음에 들어요.',
  },
}

const defaultCopyPreset = {
  opener: '지금 보여드리는 컷, 놓치지 마세요.',
  benefit: '성분부터 사용감까지, 하나하나가 사랑스러운 포인트예요.',
  cta: '영상 끝까지 보시면 왜 다들 찾는지 느껴집니다.',
}

const conceptLabelMap = Object.fromEntries(conceptOptions.map((option) => [option.id, option.label]))

const toneLabelMap: Record<string, string> = Object.fromEntries(
  Object.entries(conceptTones).flatMap(([_, tones]) => tones.map((tone) => [tone.id, tone.label])),
)

const getTonePreset = (toneId: string) => toneCopyPresets[toneId] || defaultCopyPreset

const getConceptLabel = (conceptId: ConceptType) => conceptLabelMap[conceptId] ?? '일반형'
const getToneLabel = (toneId: string) => toneLabelMap[toneId] ?? '기본 톤'

const generateSceneId = (assetId: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${assetId}-${crypto.randomUUID()}`
  }
  return `${assetId}-${Math.random().toString(36).slice(2, 9)}`
}

const composeScript = (conceptId: ConceptType, toneId: string, asset: CrawledImageAsset, index: number) => {
  const preset = getTonePreset(toneId)
  const conceptLabel = getConceptLabel(conceptId)
  const toneLabel = getToneLabel(toneId)

  return [
    `[${conceptLabel} · ${toneLabel}] ${preset.opener}`,
    `#${index + 1} ${asset.label}`,
    asset.description,
    preset.benefit,
    preset.cta,
  ].join('\n')
}

export const createSceneFromAsset = (
  asset: CrawledImageAsset,
  conceptId: ConceptType,
  toneId: string,
  index: number,
): AutoScene => {
  const recommendedScript = composeScript(conceptId, toneId, asset, index)

  return {
    id: generateSceneId(asset.id),
    assetId: asset.id,
    imageUrl: asset.url,
    imageLabel: asset.label,
    recommendedScript,
    editedScript: recommendedScript,
    layout: 'default',
  }
}

export const regenerateScenesWithStyle = (
  scenes: AutoScene[],
  conceptId: ConceptType,
  toneId: string,
): AutoScene[] => {
  return scenes.map((scene, index) => {
    const asset = crawledImagePool.find((item) => item.id === scene.assetId)
    if (!asset) return scene
    const recommendedScript = composeScript(conceptId, toneId, asset, index)
    return {
      ...scene,
      recommendedScript,
      editedScript: recommendedScript,
    }
  })
}

export const DEFAULT_SCENE_LAYOUT: SceneLayout = 'default'
export const HIGHLIGHT_SCENE_LAYOUT: SceneLayout = 'highlight'


