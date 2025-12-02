'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Pause, Settings, Type, Music, Shuffle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import StepIndicator from '@/components/StepIndicator'
import { useVideoCreateStore, TimelineData } from '@/store/useVideoCreateStore'
import { useThemeStore } from '@/store/useThemeStore'
import SubtitleSelectionDialog from '@/components/SubtitleSelectionDialog'
import BgmSelectionDialog from '@/components/BgmSelectionDialog'
import TransitionEffectDialog from '@/components/TransitionEffectDialog'
import VoiceSelectionDialog from '@/components/VoiceSelectionDialog'
import * as PIXI from 'pixi.js'
import { gsap } from 'gsap'

export default function Step4Page() {
  const router = useRouter()
  const { 
    scenes,
    selectedImages,
    timeline,
    setTimeline,
    subtitlePosition,
    subtitleFont,
    subtitleColor,
    bgmTemplate,
    transitionTemplate,
    voiceTemplate,
    setSubtitlePosition,
    setSubtitleFont,
    setSubtitleColor,
    setBgmTemplate,
    setTransitionTemplate,
    setVoiceTemplate,
    setScenes,
  } = useVideoCreateStore()
  const theme = useThemeStore((state) => state.theme)
  const pixiContainerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const texturesRef = useRef<Map<string, PIXI.Texture>>(new Map())
  const spritesRef = useRef<Map<number, PIXI.Sprite>>(new Map())
  const textsRef = useRef<Map<number, PIXI.Text>>(new Map())
  const containerRef = useRef<PIXI.Container | null>(null)
  const gsapTimelineRef = useRef<gsap.core.Timeline | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [aspectRatio, setAspectRatio] = useState<string>('9/16')

  // 씬 썸네일 계산
  const sceneThumbnails = useMemo(
    () =>
      scenes.map((scene, index) => scene.imageUrl || selectedImages[index] || ''),
    [scenes, selectedImages],
  )

  // 타임라인 초기화 및 갱신
  useEffect(() => {
    if (scenes.length === 0) return

    // 기존 timeline 참조를 안전하게 가져오기
    const currentTimeline = timeline

    const nextTimeline: TimelineData = {
      fps: 30,
      resolution: '1080x1920',
      scenes: scenes.map((scene, index) => {
        // 기존 timeline이 있으면 기존 값 유지, 없으면 기본값 사용
        const existingScene = currentTimeline?.scenes[index]
        return {
          sceneId: scene.sceneId,
          duration: existingScene?.duration || 2.5, // 기본 2.5초
          transition: existingScene?.transition || 'fade',
          transitionDuration: existingScene?.transitionDuration || 0.5, // 기본 0.5초
          image: scene.imageUrl || selectedImages[index] || '',
          imageFit: existingScene?.imageFit || 'cover', // 기본값 cover
          text: {
            content: scene.script,
            font: subtitleFont || 'Pretendard-Bold',
            color: subtitleColor || '#ffffff',
            position: subtitlePosition || 'center',
            fontSize: existingScene?.text?.fontSize || 32,
          },
        }
      }),
    }

    // 실제로 변경이 필요한 경우에만 업데이트
    const hasChanged = 
      !currentTimeline ||
      currentTimeline.scenes.length !== nextTimeline.scenes.length ||
      nextTimeline.scenes.some((scene, index) => {
        const existing = currentTimeline.scenes[index]
        return (
          !existing ||
          scene.sceneId !== existing.sceneId ||
          scene.image !== existing.image ||
          scene.text.content !== existing.text.content ||
          scene.text.font !== existing.text.font ||
          scene.text.color !== existing.text.color ||
          scene.text.position !== existing.text.position
        )
      })

    if (hasChanged) {
      setTimeline(nextTimeline)
    }
  }, [scenes, selectedImages, subtitleFont, subtitleColor, subtitlePosition, setTimeline])

  // 비율에 따른 스테이지 크기 계산
  const stageDimensions = useMemo(() => {
    const [widthRatio, heightRatio] = aspectRatio.split('/').map(Number)
    const baseSize = 1080
    const ratio = widthRatio / heightRatio
    
    if (ratio > 1) {
      // 가로가 더 긴 경우 (16:9 등)
      return { width: baseSize * ratio, height: baseSize }
    } else {
      // 세로가 더 긴 경우 (9:16 등)
      return { width: baseSize, height: baseSize / ratio }
    }
  }, [aspectRatio])

  // PixiJS Application 초기화
  useEffect(() => {
    if (!pixiContainerRef.current) return

    const container = pixiContainerRef.current
    const { width, height } = stageDimensions

    // 기존 앱이 있으면 제거
    if (appRef.current) {
      appRef.current.destroy(true, { children: true, texture: true })
      appRef.current = null
    }

    // PixiJS Application 생성
    const app = new PIXI.Application()
    
    app.init({
      width,
      height,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      container.appendChild(app.canvas)
      appRef.current = app

      // 메인 컨테이너 생성
      const mainContainer = new PIXI.Container()
      app.stage.addChild(mainContainer)
      containerRef.current = mainContainer
    }).catch((error) => {
      console.error('Failed to initialize PixiJS:', error)
    })

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true })
        appRef.current = null
      }
    }
  }, [stageDimensions])

  // 이미지 fit 방식에 따른 스프라이트 크기 및 위치 계산
  const calculateSpriteParams = (
    textureWidth: number,
    textureHeight: number,
    stageWidth: number,
    stageHeight: number,
    fit: 'cover' | 'contain' | 'fill'
  ) => {
    const imgAspect = textureWidth / textureHeight
    const stageAspect = stageWidth / stageHeight

    if (fit === 'fill') {
      return { x: 0, y: 0, width: stageWidth, height: stageHeight, scale: 1 }
    } else if (fit === 'cover') {
      let scale: number
      if (imgAspect > stageAspect) {
        scale = stageHeight / textureHeight
      } else {
        scale = stageWidth / textureWidth
      }
      const width = textureWidth * scale
      const height = textureHeight * scale
      return {
        x: (stageWidth - width) / 2,
        y: (stageHeight - height) / 2,
        width,
        height,
        scale,
      }
    } else {
      // contain
      let scale: number
      if (imgAspect > stageAspect) {
        scale = stageWidth / textureWidth
      } else {
        scale = stageHeight / textureHeight
      }
      const width = textureWidth * scale
      const height = textureHeight * scale
      return {
        x: (stageWidth - width) / 2,
        y: (stageHeight - height) / 2,
        width,
        height,
        scale,
      }
    }
  }

  // PixiJS 텍스처 로드 함수
  const loadPixiTexture = (url: string): Promise<PIXI.Texture> => {
    return new Promise((resolve, reject) => {
      if (texturesRef.current.has(url)) {
        resolve(texturesRef.current.get(url)!)
        return
      }

      // Assets API 사용
      PIXI.Assets.load(url).then((texture) => {
        texturesRef.current.set(url, texture)
        resolve(texture)
      }).catch((error) => {
        reject(new Error(`Failed to load image: ${url} - ${error}`))
      })
    })
  }

  // PixiJS로 씬 렌더링
  useEffect(() => {
    if (!appRef.current || !containerRef.current || !timeline) return

    const app = appRef.current
    const container = containerRef.current
    const { width, height } = stageDimensions

    // 기존 스프라이트와 텍스트 제거
    container.removeChildren()
    spritesRef.current.clear()
    textsRef.current.clear()

    // 모든 씬의 이미지와 텍스트 미리 로드
    const loadScene = async (sceneIndex: number) => {
      const scene = timeline.scenes[sceneIndex]
      if (!scene || !scene.image) return

      try {
        const texture = await loadPixiTexture(scene.image)
        const sprite = new PIXI.Sprite(texture)
        const imageFit = scene.imageFit || 'cover'
        const params = calculateSpriteParams(
          texture.width,
          texture.height,
          width,
          height,
          imageFit
        )

        sprite.x = params.x
        sprite.y = params.y
        sprite.width = params.width
        sprite.height = params.height
        sprite.anchor.set(0, 0)
        sprite.visible = false
        sprite.alpha = 0

        container.addChild(sprite)
        spritesRef.current.set(sceneIndex, sprite)

        // 텍스트 생성
        if (scene.text?.content) {
          const textStyle = new PIXI.TextStyle({
            fontFamily: scene.text.font || 'Arial',
            fontSize: scene.text.fontSize || 32,
            fill: scene.text.color || '#ffffff',
            align: 'center',
            dropShadow: {
              color: '#000000',
              blur: 10,
              angle: Math.PI / 4,
              distance: 2,
            },
          })

          const text = new PIXI.Text({
            text: scene.text.content,
            style: textStyle,
          })

          text.anchor.set(0.5, 0.5)
          let textY = height / 2
          if (scene.text.position === 'top') {
            textY = 200
          } else if (scene.text.position === 'bottom') {
            textY = height - 200
          }
          text.x = width / 2
          text.y = textY
          text.visible = false
          text.alpha = 0

          container.addChild(text)
          textsRef.current.set(sceneIndex, text)
        }
      } catch (error) {
        console.error(`Failed to load scene ${sceneIndex}:`, error)
      }
    }

    // 모든 씬 로드
    Promise.all(timeline.scenes.map((_, index) => loadScene(index))).then(() => {
      // 현재 씬 표시
      updateCurrentScene()
    })
  }, [timeline, stageDimensions])

  // 현재 씬 업데이트 (애니메이션 없이)
  const updateCurrentScene = () => {
    if (!containerRef.current || !timeline) return

    // 모든 스프라이트와 텍스트 숨기기
    spritesRef.current.forEach((sprite) => {
      sprite.visible = false
      sprite.alpha = 0
    })
    textsRef.current.forEach((text) => {
      text.visible = false
      text.alpha = 0
    })

    // 현재 씬 표시
    const currentSprite = spritesRef.current.get(currentSceneIndex)
    const currentText = textsRef.current.get(currentSceneIndex)

    if (currentSprite) {
      currentSprite.visible = true
      currentSprite.alpha = 1
    }
    if (currentText) {
      currentText.visible = true
      currentText.alpha = 1
    }
  }

  useEffect(() => {
    updateCurrentScene()
  }, [currentSceneIndex])

  // 재생/일시정지
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // Scene 클릭 시 해당 씬으로 이동
  const handleSceneSelect = (index: number) => {
    if (!timeline || !gsapTimelineRef.current) return
    
    // 재생 중이면 일시정지
    if (isPlaying) {
      setIsPlaying(false)
    }

    // 선택한 씬의 시작 시점 계산
    let timeUntilScene = 0
    for (let i = 0; i < index; i++) {
      timeUntilScene += timeline.scenes[i].duration + (timeline.scenes[i].transitionDuration || 0.5)
    }

    // GSAP Timeline 위치 설정
    const totalDuration = timeline.scenes.reduce(
      (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
      0
    )
    const progress = totalDuration > 0 ? timeUntilScene / totalDuration : 0
    gsapTimelineRef.current.progress(progress)
    
    setCurrentSceneIndex(index)
    setCurrentTime(timeUntilScene)
    updateCurrentScene()
  }

  // 전환 효과 적용 함수
  const applyTransition = (
    fromSprite: PIXI.Sprite | undefined,
    toSprite: PIXI.Sprite | undefined,
    fromText: PIXI.Text | undefined,
    toText: PIXI.Text | undefined,
    transition: string,
    duration: number
  ) => {
    if (!fromSprite && !toSprite) return

    const tl = gsap.timeline()

    // 기본값: fade
    if (transition === 'fade' || !transition) {
      if (fromSprite) {
        tl.to(fromSprite, { alpha: 0, duration, ease: 'none' })
      }
      if (toSprite) {
        toSprite.alpha = 0
        toSprite.visible = true
        tl.to(toSprite, { alpha: 1, duration, ease: 'none' }, 0)
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
      if (toText) {
        toText.alpha = 0
        toText.visible = true
        tl.to(toText, { alpha: 1, duration, ease: 'none' }, 0)
      }
    } else if (transition === 'slide-left') {
      if (toSprite) {
        toSprite.x = stageDimensions.width
        toSprite.visible = true
        toSprite.alpha = 1
        tl.to(toSprite, { x: 0, duration, ease: 'power2.inOut' })
      }
      if (fromSprite) {
        tl.to(fromSprite, { x: -stageDimensions.width, duration, ease: 'power2.inOut' }, 0)
      }
      if (toText) {
        toText.visible = true
        toText.alpha = 1
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
    } else if (transition === 'slide-right') {
      if (toSprite) {
        toSprite.x = -stageDimensions.width
        toSprite.visible = true
        toSprite.alpha = 1
        tl.to(toSprite, { x: 0, duration, ease: 'power2.inOut' })
      }
      if (fromSprite) {
        tl.to(fromSprite, { x: stageDimensions.width, duration, ease: 'power2.inOut' }, 0)
      }
      if (toText) {
        toText.visible = true
        toText.alpha = 1
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
    } else if (transition === 'slide-up') {
      if (toSprite) {
        toSprite.y = stageDimensions.height
        toSprite.visible = true
        toSprite.alpha = 1
        tl.to(toSprite, { y: 0, duration, ease: 'power2.inOut' })
      }
      if (fromSprite) {
        tl.to(fromSprite, { y: -stageDimensions.height, duration, ease: 'power2.inOut' }, 0)
      }
      if (toText) {
        toText.visible = true
        toText.alpha = 1
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
    } else if (transition === 'slide-down') {
      if (toSprite) {
        toSprite.y = -stageDimensions.height
        toSprite.visible = true
        toSprite.alpha = 1
        tl.to(toSprite, { y: 0, duration, ease: 'power2.inOut' })
      }
      if (fromSprite) {
        tl.to(fromSprite, { y: stageDimensions.height, duration, ease: 'power2.inOut' }, 0)
      }
      if (toText) {
        toText.visible = true
        toText.alpha = 1
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
    } else if (transition === 'zoom-in') {
      if (toSprite) {
        toSprite.scale.set(0)
        toSprite.visible = true
        toSprite.alpha = 1
        tl.to(toSprite.scale, { x: 1, y: 1, duration, ease: 'power2.out' })
      }
      if (fromSprite) {
        tl.to(fromSprite, { alpha: 0, duration, ease: 'none' }, 0)
      }
      if (toText) {
        toText.visible = true
        toText.alpha = 1
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
    } else if (transition === 'zoom-out') {
      if (toSprite) {
        toSprite.scale.set(2)
        toSprite.visible = true
        toSprite.alpha = 1
        tl.to(toSprite.scale, { x: 1, y: 1, duration, ease: 'power2.in' })
      }
      if (fromSprite) {
        tl.to(fromSprite, { alpha: 0, duration, ease: 'none' }, 0)
      }
      if (toText) {
        toText.visible = true
        toText.alpha = 1
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
    } else if (transition === 'rotate') {
      if (toSprite) {
        toSprite.rotation = Math.PI * 2
        toSprite.visible = true
        toSprite.alpha = 1
        tl.to(toSprite, { rotation: 0, duration, ease: 'power2.inOut' })
      }
      if (fromSprite) {
        tl.to(fromSprite, { alpha: 0, duration, ease: 'none' }, 0)
      }
      if (toText) {
        toText.visible = true
        toText.alpha = 1
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
    } else {
      // 기본 fade
      if (fromSprite) {
        tl.to(fromSprite, { alpha: 0, duration, ease: 'none' })
      }
      if (toSprite) {
        toSprite.alpha = 0
        toSprite.visible = true
        tl.to(toSprite, { alpha: 1, duration, ease: 'none' }, 0)
      }
      if (fromText) {
        tl.to(fromText, { alpha: 0, duration, ease: 'none' }, 0)
      }
      if (toText) {
        toText.alpha = 0
        toText.visible = true
        tl.to(toText, { alpha: 1, duration, ease: 'none' }, 0)
      }
    }

    // 전환 완료 후 이전 스프라이트 숨기기
    tl.call(() => {
      if (fromSprite) {
        fromSprite.visible = false
        fromSprite.alpha = 0
        fromSprite.x = 0
        fromSprite.y = 0
        fromSprite.scale.set(1)
        fromSprite.rotation = 0
      }
      if (fromText) {
        fromText.visible = false
        fromText.alpha = 0
      }
    })
  }

  // GSAP Timeline으로 재생 루프 구성
  useEffect(() => {
    if (!timeline || !containerRef.current) return

    // 기존 타임라인 정리
    if (gsapTimelineRef.current) {
      gsapTimelineRef.current.kill()
      gsapTimelineRef.current = null
    }

    const masterTimeline = gsap.timeline({
      paused: true,
      onUpdate: () => {
        const progress = masterTimeline.progress()
        const totalDuration = timeline.scenes.reduce(
          (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
          0
        )
        const currentTime = progress * totalDuration
        setCurrentTime(currentTime)

        // 현재 씬 인덱스 계산
        let accumulated = 0
        let sceneIndex = 0
        for (let i = 0; i < timeline.scenes.length; i++) {
          const sceneDuration = timeline.scenes[i].duration + (timeline.scenes[i].transitionDuration || 0.5)
          accumulated += sceneDuration
          if (currentTime <= accumulated) {
            sceneIndex = i
            break
          }
        }
        setCurrentSceneIndex(sceneIndex)
      },
      onComplete: () => {
        setIsPlaying(false)
      },
    })

    // 각 씬에 대한 애니메이션 추가
    let currentTime = 0
    timeline.scenes.forEach((scene, index) => {
      const fromSprite = spritesRef.current.get(index - 1)
      const toSprite = spritesRef.current.get(index)
      const fromText = textsRef.current.get(index - 1)
      const toText = textsRef.current.get(index)

      const transitionDuration = scene.transitionDuration || 0.5

      // 씬 시작 시 전환 효과 적용
      if (index > 0 && fromSprite && toSprite) {
        const transition = timeline.scenes[index - 1].transition || 'fade'
        masterTimeline.call(() => {
          applyTransition(fromSprite, toSprite, fromText, toText, transition, transitionDuration)
        }, [], currentTime)
        currentTime += transitionDuration
      } else if (toSprite) {
        // 첫 번째 씬
        masterTimeline.call(() => {
          if (toSprite) {
            toSprite.visible = true
            toSprite.alpha = 1
          }
          if (toText) {
            toText.visible = true
            toText.alpha = 1
          }
        }, [], currentTime)
      }

      // 씬 지속 시간
      currentTime += scene.duration
    })

    gsapTimelineRef.current = masterTimeline

    return () => {
      if (masterTimeline) {
        masterTimeline.kill()
      }
    }
  }, [timeline, stageDimensions])

  // 재생/일시정지 제어
  useEffect(() => {
    if (!gsapTimelineRef.current) return

    if (isPlaying) {
      gsapTimelineRef.current.play()
    } else {
      gsapTimelineRef.current.pause()
    }
  }, [isPlaying])

  // 전체 재생 길이와 현재 위치 비율
  const progressRatio = useMemo(() => {
    if (!timeline || timeline.scenes.length === 0) return 0
    const total = timeline.scenes.reduce(
      (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
      0,
    )
    if (total === 0) return 0
    return Math.min(1, currentTime / total)
  }, [timeline, currentTime])

  // 씬 스크립트 수정
  const handleSceneScriptChange = (index: number, value: string) => {
    const updatedScenes = scenes.map((scene, i) =>
      i === index ? { ...scene, script: value } : scene,
    )
    setScenes(updatedScenes)
    
    // 타임라인도 즉시 업데이트
    if (timeline) {
      const nextTimeline: TimelineData = {
        ...timeline,
        scenes: timeline.scenes.map((scene, i) =>
          i === index
            ? { ...scene, text: { ...scene.text, content: value } }
            : scene,
        ),
      }
      setTimeline(nextTimeline)
    }
  }

  // 씬 전환 효과 수정
  const handleSceneTransitionChange = (index: number, value: string) => {
    if (!timeline) return
    const nextTimeline: TimelineData = {
      ...timeline,
      scenes: timeline.scenes.map((scene, i) =>
        i === index ? { ...scene, transition: value } : scene,
      ),
    }
    setTimeline(nextTimeline)
  }

  // 씬 이미지 fit 방식 수정
  const handleSceneImageFitChange = (index: number, value: 'cover' | 'contain' | 'fill') => {
    if (!timeline) return
    const nextTimeline: TimelineData = {
      ...timeline,
      scenes: timeline.scenes.map((scene, i) =>
        i === index ? { ...scene, imageFit: value } : scene,
      ),
    }
    setTimeline(nextTimeline)
  }

  // 씬 재생 시간(duration) 수정
  const handleSceneDurationChange = (index: number, value: number) => {
    if (!timeline) return
    const clampedValue = Math.max(0.5, Math.min(10, value)) // 0.5초 ~ 10초 제한
    const nextTimeline: TimelineData = {
      ...timeline,
      scenes: timeline.scenes.map((scene, i) =>
        i === index ? { ...scene, duration: clampedValue } : scene,
      ),
    }
    setTimeline(nextTimeline)
    
    // 재생 중이면 현재 시간도 조정
    if (isPlaying && gsapTimelineRef.current) {
      const timeUntilScene = nextTimeline.scenes
        .slice(0, index)
        .reduce((acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5), 0)
      const totalDuration = nextTimeline.scenes.reduce(
        (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
        0
      )
      if (currentTime > timeUntilScene + clampedValue) {
        const newTime = timeUntilScene + clampedValue
        const progress = totalDuration > 0 ? newTime / totalDuration : 0
        gsapTimelineRef.current.progress(progress)
        setCurrentTime(newTime)
      }
    }
  }

  // 씬 전환 시간 수정
  const handleSceneTransitionDurationChange = (index: number, value: number) => {
    if (!timeline) return
    const clampedValue = Math.max(0.1, Math.min(2, value)) // 0.1초 ~ 2초 제한
    const nextTimeline: TimelineData = {
      ...timeline,
      scenes: timeline.scenes.map((scene, i) =>
        i === index ? { ...scene, transitionDuration: clampedValue } : scene,
      ),
    }
    setTimeline(nextTimeline)
  }

  // 타임라인 바 클릭/드래그로 위치 이동
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false)
  const timelineBarRef = useRef<HTMLDivElement>(null)

  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timeline) return
    // 드래그 시작 시 재생 일시정지
    if (isPlaying) {
      setIsPlaying(false)
    }
    setIsDraggingTimeline(true)
    handleTimelineClick(e)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timeline || !timelineBarRef.current || !gsapTimelineRef.current) return
    
    const rect = timelineBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clickX / rect.width))
    
    // 재생 중이면 일시정지
    if (isPlaying) {
      setIsPlaying(false)
    }

    // GSAP Timeline 위치 설정
    gsapTimelineRef.current.progress(ratio)
    
    const totalDuration = timeline.scenes.reduce(
      (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
      0
    )
    const targetTime = ratio * totalDuration
    setCurrentTime(targetTime)
    
    // 해당 시간에 맞는 씬 인덱스 계산
    let accumulated = 0
    let sceneIndex = 0
    for (let i = 0; i < timeline.scenes.length; i++) {
      const sceneDuration = timeline.scenes[i].duration + (timeline.scenes[i].transitionDuration || 0.5)
      accumulated += sceneDuration
      if (targetTime <= accumulated) {
        sceneIndex = i
        break
      }
    }
    setCurrentSceneIndex(sceneIndex)
    updateCurrentScene()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTimeline || !timeline || !timelineBarRef.current || !gsapTimelineRef.current) return
      
      const rect = timelineBarRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const ratio = Math.max(0, Math.min(1, mouseX / rect.width))
      
      // GSAP Timeline 위치 설정
      gsapTimelineRef.current.progress(ratio)
      
      const totalDuration = timeline.scenes.reduce(
        (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
        0
      )
      const targetTime = ratio * totalDuration
      
      setCurrentTime(targetTime)
      
      // 해당 시간에 맞는 씬 인덱스 계산
      let accumulated = 0
      let sceneIndex = 0
      for (let i = 0; i < timeline.scenes.length; i++) {
        const sceneDuration = timeline.scenes[i].duration + (timeline.scenes[i].transitionDuration || 0.5)
        accumulated += sceneDuration
        if (targetTime <= accumulated) {
          sceneIndex = i
          break
        }
      }
      setCurrentSceneIndex(sceneIndex)
      updateCurrentScene()
    }

    const handleMouseUp = () => {
      setIsDraggingTimeline(false)
    }

    if (isDraggingTimeline) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDraggingTimeline, timeline])

  // 최종 영상 생성
  const handleGenerateVideo = async () => {
    if (!timeline) {
      alert('타임라인 데이터가 없습니다.')
      return
    }

    // TODO: 서버로 타임라인 데이터 전송
    // 서버에서 ffmpeg로 영상 생성
    alert('영상 생성 기능은 추후 구현 예정입니다.')
  }

  // 다음 단계로 이동
  const handleNext = () => {
    router.push('/video/create/step6')
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex min-h-screen"
    >
      <StepIndicator />
      <div className="flex-1 flex overflow-hidden">
        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden min-w-0">
          <div className="h-full flex flex-col">
            <div className="shrink-0 mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  미리보기 및 효과 선택
                </h1>
                <p className={`text-sm md:text-base ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  미리보기에서 전체 흐름을 확인하고, 각 Scene의 자막과 효과를 편집하세요.
                </p>
              </div>
              {/* 다음 단계 버튼 */}
              <div className="shrink-0">
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="gap-2"
                >
                  다음 단계
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 md:gap-6 min-h-0 overflow-hidden">
              {/* 좌측: Canvas 미리보기 */}
              <div className="flex flex-col space-y-4 min-h-0">
                <Card className={`flex-1 flex flex-col min-h-0 max-h-[800px] ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <CardHeader className="shrink-0">
                    <CardTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                      Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 flex flex-col gap-3 md:gap-4 justify-center items-center">
                      {/* 비율 선택 */}
                      <div className="w-full px-2 space-y-3">
                        <div>
                          <label className={`block text-xs md:text-sm mb-1.5 ${
                            theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            비율 선택
                          </label>
                          <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className={`w-full text-xs md:text-sm rounded-md border px-2 py-1.5 ${
                              theme === 'dark'
                                ? 'bg-gray-800 border-gray-700 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                          >
                            <option value="9/16">9:16 (세로, 스토리/쇼츠)</option>
                            <option value="16/9">16:9 (가로, 유튜브)</option>
                            <option value="1/1">1:1 (정사각형, 인스타그램)</option>
                            <option value="4/3">4:3 (전통)</option>
                          </select>
                        </div>
                        {timeline && timeline.scenes[currentSceneIndex] && (
                          <div>
                            <label className={`block text-xs md:text-sm mb-1.5 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              이미지 표시 방식 (Scene {currentSceneIndex + 1})
                            </label>
                            <select
                              value={timeline.scenes[currentSceneIndex].imageFit || 'cover'}
                              onChange={(e) => handleSceneImageFitChange(currentSceneIndex, e.target.value as 'cover' | 'contain' | 'fill')}
                              className={`w-full text-xs md:text-sm rounded-md border px-2 py-1.5 ${
                                theme === 'dark'
                                  ? 'bg-gray-800 border-gray-700 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                            >
                              <option value="cover">Cover (채우기, 일부 잘릴 수 있음)</option>
                              <option value="contain">Contain (전체 보이기, 여백 생길 수 있음)</option>
                              <option value="fill">Fill (늘리기, 비율 무시)</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <div className="relative border-2 border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden w-full max-w-full" style={{ maxWidth: 'min(100%, 300px)' }}>
                        <div
                          ref={pixiContainerRef}
                          className="w-full h-auto bg-black"
                          style={{ aspectRatio }}
                        />
                      </div>
                      {/* 재생 바 */}
                      <div className="w-full space-y-1.5 md:space-y-2 px-2">
                        <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-500 dark:text-gray-400">
                          <span>Scene {currentSceneIndex + 1} / {scenes.length || 0}</span>
                        </div>
                        <div
                          ref={timelineBarRef}
                          className="w-full h-1.5 md:h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-pointer relative"
                          onMouseDown={handleTimelineMouseDown}
                        >
                          <div
                            className="h-full bg-purple-500 transition-all"
                            style={{ width: `${progressRatio * 100}%` }}
                          />
                          {isDraggingTimeline && (
                            <div className="absolute inset-0 bg-purple-500/20" />
                          )}
                        </div>
                      </div>
                      <div className="w-full flex flex-col sm:flex-row gap-2 px-2">
                        <Button
                          onClick={handlePlayPause}
                          variant="outline"
                          size="sm"
                          className="w-full sm:flex-1 text-xs md:text-sm"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                              일시정지
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                              재생
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleGenerateVideo}
                          size="sm"
                          className="w-full sm:flex-1 text-xs md:text-sm"
                        >
                          최종 영상 만들기
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 우측: Scene 리스트 */}
              <div className="flex flex-col min-h-0">
                <Card className={`flex flex-col h-full max-h-[800px] ${
                  theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                  <CardHeader className="shrink-0 pb-3">
                    <CardTitle className={`text-base ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      Scene 리스트
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto min-h-0">
                    {scenes.length === 0 ? (
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Step3에서 이미지와 스크립트를 먼저 생성해주세요.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {scenes.map((scene, index) => {
                          const thumb = sceneThumbnails[index]
                          const isActive = currentSceneIndex === index
                          const sceneTransition =
                            timeline?.scenes[index]?.transition ?? 'fade'
                          const sceneImageFit =
                            timeline?.scenes[index]?.imageFit ?? 'cover'
                          return (
                            <div
                              key={scene.sceneId ?? index}
                              className={`flex gap-2 rounded-lg border p-2 cursor-pointer transition-colors ${
                                isActive
                                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                  : theme === 'dark'
                                    ? 'border-gray-700 bg-gray-900 hover:border-purple-500'
                                    : 'border-gray-200 bg-white hover:border-purple-500'
                              }`}
                              onClick={() => handleSceneSelect(index)}
                            >
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0">
                                {thumb ? (
                                  <img
                                    src={thumb}
                                    alt={`Scene ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : null}
                              </div>
                              <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className={`text-[10px] font-semibold uppercase ${
                                    theme === 'dark' ? 'text-purple-300' : 'text-purple-700'
                                  }`}>
                                    Scene {index + 1}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <div className="flex items-center gap-0.5">
                                      <span className={`text-[10px] ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        시간:
                                      </span>
                                      <input
                                        type="number"
                                        min="0.5"
                                        max="10"
                                        step="0.1"
                                        value={timeline?.scenes[index]?.duration?.toFixed(1) || '2.5'}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value)
                                          if (!isNaN(value)) {
                                            handleSceneDurationChange(index, value)
                                          }
                                        }}
                                        className={`w-10 text-[10px] rounded-md border px-0.5 py-0.5 text-right ${
                                          theme === 'dark'
                                            ? 'bg-gray-800 border-gray-700 text-white'
                                            : 'bg-white border-gray-300 text-gray-900'
                                        } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <span className={`text-[10px] ${
                                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                      }`}>
                                        초
                                      </span>
                                    </div>
                                    <select
                                      value={sceneTransition}
                                      onChange={(e) =>
                                        handleSceneTransitionChange(index, e.target.value)
                                      }
                                      className={`text-[10px] rounded-md border px-1.5 py-0.5 bg-transparent ${
                                        theme === 'dark'
                                          ? 'border-gray-700 text-gray-200'
                                          : 'border-gray-300 text-gray-700'
                                      } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <option value="fade">Fade</option>
                                      <option value="slide-left">Slide Left</option>
                                      <option value="slide-right">Slide Right</option>
                                      <option value="slide-up">Slide Up</option>
                                      <option value="slide-down">Slide Down</option>
                                      <option value="zoom-in">Zoom In</option>
                                      <option value="zoom-out">Zoom Out</option>
                                      <option value="wipe-left">Wipe Left</option>
                                      <option value="wipe-right">Wipe Right</option>
                                      <option value="blur">Blur</option>
                                      <option value="glitch">Glitch</option>
                                      <option value="rotate">Rotate</option>
                                      <option value="pixelate">Pixelate</option>
                                      <option value="wave">Wave</option>
                                      <option value="ripple">Ripple</option>
                                      <option value="circle">Circle</option>
                                      <option value="crossfade">Crossfade</option>
                                    </select>
                                    {index > 0 && (
                                      <div className="flex items-center gap-0.5">
                                        <span className={`text-[10px] ${
                                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                          전환:
                                        </span>
                                        <input
                                          type="number"
                                          min="0.1"
                                          max="2"
                                          step="0.1"
                                          value={timeline?.scenes[index]?.transitionDuration?.toFixed(1) || '0.5'}
                                          onChange={(e) => {
                                            const value = parseFloat(e.target.value)
                                            if (!isNaN(value)) {
                                              handleSceneTransitionDurationChange(index, value)
                                            }
                                          }}
                                          className={`w-8 text-[10px] rounded-md border px-0.5 py-0.5 text-right ${
                                            theme === 'dark'
                                              ? 'bg-gray-800 border-gray-700 text-white'
                                              : 'bg-white border-gray-300 text-gray-900'
                                          } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <span className={`text-[10px] ${
                                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                        }`}>
                                          초
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[10px] ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                                  }`}>
                                    이미지:
                                  </span>
                                  <select
                                    value={sceneImageFit}
                                    onChange={(e) =>
                                      handleSceneImageFitChange(index, e.target.value as 'cover' | 'contain' | 'fill')
                                    }
                                    className={`text-[10px] rounded-md border px-1.5 py-0.5 bg-transparent ${
                                      theme === 'dark'
                                        ? 'border-gray-700 text-gray-200'
                                        : 'border-gray-300 text-gray-700'
                                    } focus:outline-none focus:ring-1 focus:ring-purple-500`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <option value="cover">Cover</option>
                                    <option value="contain">Contain</option>
                                    <option value="fill">Fill</option>
                                  </select>
                                </div>
                                <textarea
                                  rows={2}
                                  value={scene.script}
                                  onChange={(e) =>
                                    handleSceneScriptChange(index, e.target.value)
                                  }
                                  className={`w-full text-xs rounded-md border px-1.5 py-1 resize-none ${
                                    theme === 'dark'
                                      ? 'bg-gray-800 border-gray-700 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽 사이드바: 효과 선택 (아이콘만) - sticky */}
        <div className={`w-16 md:w-20 border-l flex flex-col items-center py-4 gap-3 sticky top-0 self-start ${
          theme === 'dark' ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'
        }`}>
          <SubtitleSelectionDialog>
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors ${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              }`}
              title="자막 선택"
            >
              <Type className="w-6 h-6" />
            </Button>
          </SubtitleSelectionDialog>

          <BgmSelectionDialog>
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors ${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              }`}
              title="배경음악 선택"
            >
              <Music className="w-6 h-6" />
            </Button>
          </BgmSelectionDialog>

          <TransitionEffectDialog>
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors ${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              }`}
              title="전환 효과"
            >
              <Shuffle className="w-6 h-6" />
            </Button>
          </TransitionEffectDialog>

          <VoiceSelectionDialog>
            <Button
              variant="ghost"
              size="icon"
              className={`w-12 h-12 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors ${
                theme === 'dark' ? 'text-gray-300 hover:text-purple-400' : 'text-gray-600 hover:text-purple-600'
              }`}
              title="목소리 선택"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </VoiceSelectionDialog>
        </div>
      </div>
    </motion.div>
  )
}



