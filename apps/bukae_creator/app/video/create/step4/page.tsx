'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, Image as ImageIcon, Clock, Edit2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import StepIndicator from '@/components/StepIndicator'
import { useVideoCreateStore, TimelineData } from '@/store/useVideoCreateStore'
import { useThemeStore } from '@/store/useThemeStore'
import * as PIXI from 'pixi.js'

export default function Step4Page() {
  const router = useRouter()
  const { 
    scenes,
    selectedImages,
    timeline,
    setTimeline,
    setScenes,
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
  } = useVideoCreateStore()
  const theme = useThemeStore((state) => state.theme)
  
  // PixiJS refs
  const pixiContainerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const containerRef = useRef<PIXI.Container | null>(null)
  const texturesRef = useRef<Map<string, PIXI.Texture>>(new Map())
  const spritesRef = useRef<Map<number, PIXI.Sprite>>(new Map())
  const textsRef = useRef<Map<number, PIXI.Text>>(new Map())
  
  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [aspectRatio, setAspectRatio] = useState<string>('9/16')
  const [rightPanelTab, setRightPanelTab] = useState('animation')
  const [isDraggingTimeline, setIsDraggingTimeline] = useState(false)
  const timelineBarRef = useRef<HTMLDivElement>(null)
  const [pixiReady, setPixiReady] = useState(false)
  const rafIdRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // 클라이언트에서만 렌더링 (SSR/Hydration mismatch 방지)
  useEffect(() => {
    setMounted(true)
  }, [])

  // 스테이지 크기 계산
  const stageDimensions = useMemo(() => {
    const [widthRatio, heightRatio] = aspectRatio.split('/').map(Number)
    const baseSize = 1080
    const ratio = widthRatio / heightRatio
    
    if (ratio > 1) {
      return { width: baseSize * ratio, height: baseSize }
    } else {
      return { width: baseSize, height: baseSize / ratio }
    }
  }, [aspectRatio])

  // 대본 길이 기반 자동 duration 계산 (대략 초당 8글자, 1~5초 범위)
  const getSceneDuration = (script: string) => {
    if (!script) return 2.5
    const length = script.replace(/\s+/g, '').length
    const raw = length / 8
    return Math.max(1, Math.min(5, raw))
  }

  // 타임라인 초기화
  useEffect(() => {
    if (scenes.length === 0) return

    console.log('Step4 scenes from store:', scenes)
    console.log('Step4 selectedImages from store:', selectedImages)

    const nextTimeline: TimelineData = {
      fps: 30,
      resolution: '1080x1920',
      scenes: scenes.map((scene, index) => {
        const existingScene = timeline?.scenes[index]
        return {
          sceneId: scene.sceneId,
          duration: existingScene?.duration || getSceneDuration(scene.script),
          transition: existingScene?.transition || 'fade',
          transitionDuration: existingScene?.transitionDuration || 0.5,
          image: scene.imageUrl || selectedImages[index] || '',
          imageFit: existingScene?.imageFit || 'cover',
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

    console.log('Step4 nextTimeline:', nextTimeline)

    const hasChanged = 
      !timeline ||
      timeline.scenes.length !== nextTimeline.scenes.length ||
      nextTimeline.scenes.some((scene, index) => {
        const existing = timeline.scenes[index]
        return (
          !existing ||
          scene.sceneId !== existing.sceneId ||
          scene.image !== existing.image ||
          scene.text.content !== existing.text.content
        )
      })

    if (hasChanged) {
      setTimeline(nextTimeline)
    }
  }, [scenes, selectedImages, subtitleFont, subtitleColor, subtitlePosition, setTimeline, timeline])

  // PixiJS 초기화
  useEffect(() => {
    if (!mounted) return
    if (!pixiContainerRef.current) {
      console.log('Step4: pixiContainerRef.current is null')
      return
    }

    const container = pixiContainerRef.current
    const { width, height } = stageDimensions

    console.log('Step4: Initializing PixiJS with dimensions:', width, height)

    if (appRef.current) {
      const existingCanvas = container.querySelector('canvas')
      if (existingCanvas) container.removeChild(existingCanvas)
      appRef.current.destroy(true, { children: true, texture: true })
      appRef.current = null
      containerRef.current = null
    }

    const app = new PIXI.Application()
    
    app.init({
      width,
      height,
      backgroundColor: 0x000000,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    }).then(() => {
      console.log('Step4: PixiJS initialized successfully')
      app.canvas.style.width = '100%'
      app.canvas.style.height = '100%'
      app.canvas.style.display = 'block'
      container.appendChild(app.canvas)
      appRef.current = app

      const mainContainer = new PIXI.Container()
      app.stage.addChild(mainContainer)
      containerRef.current = mainContainer

      console.log('Step4: appRef and containerRef set, app:', !!appRef.current, 'container:', !!containerRef.current)

      // 다음 프레임에 pixiReady 설정하여 ref가 확실히 업데이트된 후 loadAllScenes가 실행되도록
      requestAnimationFrame(() => {
        setPixiReady(true)
        console.log('Step4: pixiReady set to true')
      })
    }).catch((error) => {
      console.error('Step4: Failed to initialize PixiJS:', error)
    })

    return () => {
      if (appRef.current) {
        const existingCanvas = container.querySelector('canvas')
        if (existingCanvas) container.removeChild(existingCanvas)
        appRef.current.destroy(true, { children: true, texture: true })
        appRef.current = null
        containerRef.current = null
      }
      setPixiReady(false)
    }
  }, [mounted, stageDimensions])

  // 이미지 fit 계산
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
      return { x: 0, y: 0, width: stageWidth, height: stageHeight }
    } else if (fit === 'cover') {
      const scale = imgAspect > stageAspect 
        ? stageHeight / textureHeight 
        : stageWidth / textureWidth
      const width = textureWidth * scale
      const height = textureHeight * scale
      return {
        x: (stageWidth - width) / 2,
        y: (stageHeight - height) / 2,
        width,
        height,
      }
    } else {
      const scale = imgAspect > stageAspect 
        ? stageWidth / textureWidth 
        : stageHeight / textureHeight
      const width = textureWidth * scale
      const height = textureHeight * scale
      return {
        x: (stageWidth - width) / 2,
        y: (stageHeight - height) / 2,
        width,
        height,
      }
    }
  }

  // 텍스처 로드
  const loadPixiTexture = (url: string): Promise<PIXI.Texture> => {
    return new Promise((resolve, reject) => {
      if (texturesRef.current.has(url)) {
        resolve(texturesRef.current.get(url)!)
        return
      }

      if (url.startsWith('data:') || url.startsWith('blob:')) {
        try {
          const texture = PIXI.Texture.from(url)
          texturesRef.current.set(url, texture)
          resolve(texture)
          return
        } catch (error) {
          console.error('Failed to load data/blob URL:', error)
        }
      }

      PIXI.Assets.load(url)
        .then((texture) => {
          if (texture) {
            texturesRef.current.set(url, texture)
            resolve(texture)
          } else {
            reject(new Error(`Invalid texture: ${url}`))
          }
        })
        .catch((error) => {
          try {
            const fallbackTexture = PIXI.Texture.from(url)
            if (fallbackTexture) {
              texturesRef.current.set(url, fallbackTexture)
              resolve(fallbackTexture)
            } else {
              reject(new Error(`Failed to load: ${url}`))
            }
          } catch (fallbackError) {
            reject(new Error(`Failed to load: ${url}`))
          }
        })
    })
  }

  // 현재 씬 업데이트
  const updateCurrentScene = useCallback(() => {
    console.log('Step4: updateCurrentScene called, index:', currentSceneIndex, 'container:', !!containerRef.current, 'timeline:', !!timeline)
    if (!containerRef.current || !timeline) {
      console.log('Step4: updateCurrentScene skipped - missing container or timeline')
      return
    }

    const spriteCount = spritesRef.current.size
    const textCount = textsRef.current.size
    console.log('Step4: updateCurrentScene - sprites:', spriteCount, 'texts:', textCount)

    spritesRef.current.forEach((sprite, index) => {
      if (sprite?.parent) {
        sprite.visible = false
        sprite.alpha = 0
      }
    })
    textsRef.current.forEach((text, index) => {
      if (text?.parent) {
        text.visible = false
        text.alpha = 0
      }
    })

    const currentSprite = spritesRef.current.get(currentSceneIndex)
    const currentText = textsRef.current.get(currentSceneIndex)

    console.log('Step4: updateCurrentScene - currentSprite:', !!currentSprite, 'currentText:', !!currentText)

    if (currentSprite?.parent) {
      currentSprite.visible = true
      currentSprite.alpha = 1
      console.log('Step4: Current sprite made visible')
    } else {
      console.log('Step4: Current sprite not found or not in parent')
    }
    if (currentText?.parent) {
      currentText.visible = true
      currentText.alpha = 1
      console.log('Step4: Current text made visible')
    }

    // 렌더링 강제 실행
    if (appRef.current) {
      appRef.current.render()
      console.log('Step4: Rendered after updateCurrentScene')
    }
  }, [currentSceneIndex, timeline])

  // 모든 씬 로드
  const loadAllScenes = useCallback(async () => {
    if (!appRef.current || !containerRef.current || !timeline) {
      console.log('Step4: loadAllScenes skipped - app:', !!appRef.current, 'container:', !!containerRef.current, 'timeline:', !!timeline)
      return
    }

    console.log('Step4: loadAllScenes started, scenes count:', timeline.scenes.length)

    const container = containerRef.current
    const { width, height } = stageDimensions

    container.removeChildren()
    spritesRef.current.clear()
    textsRef.current.clear()

    const loadScene = async (sceneIndex: number) => {
      const scene = timeline.scenes[sceneIndex]
      if (!scene || !scene.image) {
        console.log(`Step4: Scene ${sceneIndex} skipped - no scene or image`)
        return
      }

      try {
        console.log(`Step4: Loading scene ${sceneIndex}, image:`, scene.image)
        const texture = await loadPixiTexture(scene.image)
        console.log(`Step4: Texture loaded for scene ${sceneIndex}, size:`, texture.width, texture.height)
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
        console.log(`Step4: Sprite added for scene ${sceneIndex}`)

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

    await Promise.all(timeline.scenes.map((_, index) => loadScene(index)))
    
    console.log(
      'Step4: All scenes loaded - sprites:',
      spritesRef.current.size,
      'texts:',
      textsRef.current.size
    )
    
    // 렌더링 강제 실행
    requestAnimationFrame(() => {
      console.log('Step4: Updating current scene after load, index:', currentSceneIndex)
      updateCurrentScene()
      if (appRef.current) {
        console.log('Step4: Rendering PixiJS app')
        appRef.current.render()
      } else {
        console.error('Step4: appRef.current is null after loadAllScenes')
      }
    })
  }, [timeline, stageDimensions, updateCurrentScene, currentSceneIndex])

  // Pixi와 타임라인이 모두 준비되면 씬 로드
  useEffect(() => {
    console.log('Step4: loadAllScenes effect - pixiReady:', pixiReady, 'app:', !!appRef.current, 'container:', !!containerRef.current, 'timeline:', !!timeline, 'scenes:', timeline?.scenes.length)
    if (!pixiReady || !appRef.current || !containerRef.current || !timeline || timeline.scenes.length === 0) {
      console.log('Step4: loadAllScenes effect skipped - waiting for refs')
      return
    }
    console.log('Step4: Calling loadAllScenes')
    // 다음 프레임에 실행하여 ref가 확실히 설정된 후 실행
    requestAnimationFrame(() => {
      loadAllScenes()
    })
  }, [pixiReady, timeline, loadAllScenes])

  useEffect(() => {
    updateCurrentScene()
  }, [updateCurrentScene])

  // 재생/일시정지
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  // 씬 선택
  const handleSceneSelect = (index: number) => {
    if (!timeline) return
    if (isPlaying) setIsPlaying(false)
    setCurrentSceneIndex(index)
    
    let timeUntilScene = 0
    for (let i = 0; i < index; i++) {
      timeUntilScene += timeline.scenes[i].duration + (timeline.scenes[i].transitionDuration || 0.5)
    }
    setCurrentTime(timeUntilScene)
    updateCurrentScene()
  }

  // 전체 재생 시간 계산
  const totalDuration = useMemo(() => {
    if (!timeline) return 0
    return timeline.scenes.reduce(
      (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
      0
    )
  }, [timeline])

  // 재생 루프 (requestAnimationFrame)
  useEffect(() => {
    if (!isPlaying || totalDuration === 0) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      lastTimestampRef.current = null
      return
    }

    const step = (timestamp: number) => {
      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = timestamp
      }
      const delta = (timestamp - lastTimestampRef.current) / 1000
      lastTimestampRef.current = timestamp

      setCurrentTime((prev) => {
        const next = prev + delta
        if (next >= totalDuration) {
          // 재생 끝
          setIsPlaying(false)
          return totalDuration
        }
        return next
      })

      if (isPlaying) {
        rafIdRef.current = requestAnimationFrame(step)
      }
    }

    rafIdRef.current = requestAnimationFrame(step)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      lastTimestampRef.current = null
    }
  }, [isPlaying, totalDuration])

  // currentTime 변화에 따라 현재 씬 업데이트
  useEffect(() => {
    if (!timeline || timeline.scenes.length === 0) return
    if (totalDuration === 0) return

    let accumulated = 0
    let sceneIndex = 0
    for (let i = 0; i < timeline.scenes.length; i++) {
      const sceneDuration =
        timeline.scenes[i].duration + (timeline.scenes[i].transitionDuration || 0.5)
      accumulated += sceneDuration
      if (currentTime <= accumulated) {
        sceneIndex = i
        break
      }
    }
    setCurrentSceneIndex(sceneIndex)
    updateCurrentScene()
  }, [currentTime, timeline, totalDuration, updateCurrentScene])

  // 진행률 계산
  const progressRatio = useMemo(() => {
    if (totalDuration === 0) return 0
    return Math.min(1, currentTime / totalDuration)
  }, [totalDuration, currentTime])

  // 씬 편집 핸들러들
  const handleSceneScriptChange = (index: number, value: string) => {
    const updatedScenes = scenes.map((scene, i) =>
      i === index ? { ...scene, script: value } : scene
    )
    setScenes(updatedScenes)
    
    if (timeline) {
      const nextTimeline: TimelineData = {
        ...timeline,
        scenes: timeline.scenes.map((scene, i) =>
          i === index ? { ...scene, text: { ...scene.text, content: value } } : scene
        ),
      }
      setTimeline(nextTimeline)
    }
  }

  const handleSceneDurationChange = (index: number, value: number) => {
    if (!timeline) return
    const clampedValue = Math.max(0.5, Math.min(10, value))
    const nextTimeline: TimelineData = {
      ...timeline,
      scenes: timeline.scenes.map((scene, i) =>
        i === index ? { ...scene, duration: clampedValue } : scene
      ),
    }
    setTimeline(nextTimeline)
  }

  const handleSceneTransitionChange = (index: number, value: string) => {
    if (!timeline) return
    const nextTimeline: TimelineData = {
      ...timeline,
      scenes: timeline.scenes.map((scene, i) =>
        i === index ? { ...scene, transition: value } : scene
      ),
    }
    setTimeline(nextTimeline)
  }

  const handleSceneImageFitChange = (index: number, value: 'cover' | 'contain' | 'fill') => {
    if (!timeline) return
    const nextTimeline: TimelineData = {
      ...timeline,
      scenes: timeline.scenes.map((scene, i) =>
        i === index ? { ...scene, imageFit: value } : scene
      ),
    }
    setTimeline(nextTimeline)
  }

  // 타임라인 드래그
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timeline) return
    if (isPlaying) setIsPlaying(false)
    setIsDraggingTimeline(true)
    handleTimelineClick(e)
  }

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timeline || !timelineBarRef.current) return
    
    const rect = timelineBarRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, clickX / rect.width))
    
    if (isPlaying) setIsPlaying(false)
    
    const totalDuration = timeline.scenes.reduce(
      (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
      0
    )
    const targetTime = ratio * totalDuration
    setCurrentTime(targetTime)
    
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
      if (!isDraggingTimeline || !timeline || !timelineBarRef.current) return
      
      const rect = timelineBarRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const ratio = Math.max(0, Math.min(1, mouseX / rect.width))
      
      const totalDuration = timeline.scenes.reduce(
        (acc, scene) => acc + scene.duration + (scene.transitionDuration || 0.5),
        0
      )
      const targetTime = ratio * totalDuration
      setCurrentTime(targetTime)
      
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
  }, [isDraggingTimeline, timeline, updateCurrentScene])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 서버 전송
  const handleExport = async () => {
    if (!timeline) {
      alert('타임라인 데이터가 없습니다.')
      return
    }

    try {
      // TimelineData를 JSON으로 직렬화
      const exportData = {
        ...timeline,
        globalSettings: {
          bgmTemplate,
          transitionTemplate,
          voiceTemplate,
          subtitlePosition,
          subtitleFont,
          subtitleColor,
        },
      }

      console.log('Exporting timeline data:', exportData)

      // API 엔드포인트로 전송
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || '영상 생성 실패')
      }

      const result = await response.json()
      alert('영상 생성이 시작되었습니다. 완료되면 알림을 받으실 수 있습니다.')
      
      // 성공 시 다음 단계로 이동하거나 결과 페이지로 이동
      // router.push(`/video/create/result?id=${result.videoId}`)
    } catch (error) {
      console.error('Export error:', error)
      alert(`영상 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  const sceneThumbnails = useMemo(
    () => scenes.map((scene, index) => scene.imageUrl || selectedImages[index] || ''),
    [scenes, selectedImages]
  )

  if (!mounted) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen"
    >
      <StepIndicator />
      <div className="flex-1 flex overflow-hidden">
        {/* 왼쪽 패널: 미리보기 + 타임라인 */}
        <div className="w-[30%] border-r flex flex-col" style={{
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
        }}>
          <div className="p-4 border-b" style={{
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className="text-lg font-semibold" style={{
              color: theme === 'dark' ? '#ffffff' : '#111827'
            }}>
              미리보기
            </h2>
          </div>
          
          <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
            {/* 비율 선택 */}
            <div>
              <label className="block text-sm mb-2" style={{
                color: theme === 'dark' ? '#d1d5db' : '#374151'
              }}>
                비율
              </label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                  color: theme === 'dark' ? '#ffffff' : '#111827'
                }}
              >
                <option value="9/16">9:16 (세로)</option>
                <option value="16/9">16:9 (가로)</option>
                <option value="1/1">1:1 (정사각형)</option>
                <option value="4/3">4:3</option>
              </select>
            </div>

            {/* PixiJS 미리보기 */}
            <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden min-h-0">
              <div
                ref={pixiContainerRef}
                className="w-full h-full"
                style={{ aspectRatio }}
              />
            </div>

            {/* 재생 컨트롤 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs" style={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
              
              <div
                ref={timelineBarRef}
                className="w-full h-2 rounded-full cursor-pointer relative"
                style={{
                  backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb'
                }}
                onMouseDown={handleTimelineMouseDown}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${progressRatio * 100}%`,
                    backgroundColor: '#8b5cf6'
                  }}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handlePlayPause}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      일시정지
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      재생
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleExport}
                  size="sm"
                  className="flex-1"
                >
                  내보내기
                </Button>
              </div>
            </div>

            {/* 선택된 애셋 정보 */}
            {timeline && timeline.scenes[currentSceneIndex] && (
              <div className="p-3 rounded-lg border text-sm" style={{
                backgroundColor: theme === 'dark' ? '#1f2937' : '#f9fafb',
                borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                color: theme === 'dark' ? '#d1d5db' : '#374151'
              }}>
                <div className="font-semibold mb-2">선택된 애셋</div>
                <div className="space-y-1 text-xs">
                  <div>씬: {currentSceneIndex + 1}</div>
                  <div>이미지: {timeline.scenes[currentSceneIndex].imageFit || 'cover'}</div>
                  <div>텍스트: {timeline.scenes[currentSceneIndex].text.content.substring(0, 30)}...</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 중앙 패널: 씬 리스트 */}
        <div className="w-[40%] border-r flex flex-col" style={{
          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
        }}>
          <div className="p-4 border-b" style={{
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className="text-lg font-semibold" style={{
              color: theme === 'dark' ? '#ffffff' : '#111827'
            }}>
              씬 리스트
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {scenes.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{
                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
              }}>
                Step3에서 이미지와 스크립트를 먼저 생성해주세요.
              </div>
            ) : (
              <div className="space-y-3">
                {scenes.map((scene, index) => {
                  const isActive = currentSceneIndex === index
                  const sceneData = timeline?.scenes[index]
                  
                  return (
                    <div
                      key={scene.sceneId ?? index}
                      className="rounded-lg border p-3 cursor-pointer transition-colors"
                      style={{
                        borderColor: isActive 
                          ? '#8b5cf6' 
                          : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                        backgroundColor: isActive
                          ? (theme === 'dark' ? '#3b1f5f' : '#f3e8ff')
                          : (theme === 'dark' ? '#1f2937' : '#ffffff')
                      }}
                      onClick={() => handleSceneSelect(index)}
                    >
                      <div className="flex gap-3">
                        {/* 썸네일 */}
                        <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 shrink-0">
                          {sceneThumbnails[index] && (
                            <img
                              src={sceneThumbnails[index]}
                              alt={`Scene ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>

                        {/* 씬 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4" style={{
                                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                              }} />
                              <span className="text-sm font-semibold" style={{
                                color: theme === 'dark' ? '#ffffff' : '#111827'
                              }}>
                                씬 {index + 1}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs" style={{
                              color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                            }}>
                              <Clock className="w-3 h-3" />
                              <span>{sceneData?.duration.toFixed(1) || '2.5'}초</span>
                            </div>
                          </div>

                          {/* 텍스트 입력 */}
                          <textarea
                            rows={2}
                            value={scene.script}
                            onChange={(e) => handleSceneScriptChange(index, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-sm rounded-md border px-2 py-1 resize-none mb-2"
                            style={{
                              backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                              borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                              color: theme === 'dark' ? '#ffffff' : '#111827'
                            }}
                            placeholder="씬 텍스트 입력..."
                          />

                          {/* 설정 (전환 효과만 표시, 시간은 대본 길이로 자동 계산) */}
                          <div className="flex items-center gap-2 text-xs">
                            <select
                              value={sceneData?.transition || 'fade'}
                              onChange={(e) => handleSceneTransitionChange(index, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2 py-1 rounded border text-xs"
                              style={{
                                backgroundColor: theme === 'dark' ? '#111827' : '#ffffff',
                                borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                                color: theme === 'dark' ? '#ffffff' : '#111827'
                              }}
                            >
                              <option value="fade">Fade</option>
                              <option value="slide-left">Slide Left</option>
                              <option value="slide-right">Slide Right</option>
                              <option value="zoom-in">Zoom In</option>
                              <option value="zoom-out">Zoom Out</option>
                            </select>
                            <span
                              className="px-2 py-1 rounded border text-xs"
                              style={{
                                backgroundColor: theme === 'dark' ? '#111827' : '#f9fafb',
                                borderColor: theme === 'dark' ? '#374151' : '#d1d5db',
                                color: theme === 'dark' ? '#9ca3af' : '#6b7280'
                              }}
                            >
                              {sceneData?.duration.toFixed(1) || '1.0'}초 (자동)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* 오른쪽 패널: 효과 선택 */}
        <div className="w-[30%] flex flex-col" style={{
          backgroundColor: theme === 'dark' ? '#111827' : '#ffffff'
        }}>
          <div className="p-4 border-b" style={{
            borderColor: theme === 'dark' ? '#374151' : '#e5e7eb'
          }}>
            <h2 className="text-lg font-semibold" style={{
              color: theme === 'dark' ? '#ffffff' : '#111827'
            }}>
              효과
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Tabs value={rightPanelTab} onValueChange={setRightPanelTab} className="p-4">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="animation">애니메이션</TabsTrigger>
                <TabsTrigger value="bgm">배경음악</TabsTrigger>
                <TabsTrigger value="subtitle">자막</TabsTrigger>
              </TabsList>
              
              <TabsContent value="animation" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{
                    color: theme === 'dark' ? '#ffffff' : '#111827'
                  }}>
                    등장/퇴장
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['페이드', '슬라이드', '줌', '회전'].map((effect) => (
                      <button
                        key={effect}
                        className="p-3 rounded-lg border text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        style={{
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#d1d5db' : '#374151'
                        }}
                      >
                        {effect}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{
                    color: theme === 'dark' ? '#ffffff' : '#111827'
                  }}>
                    강조
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {['펄스', '흔들림', '반짝임', '확대'].map((effect) => (
                      <button
                        key={effect}
                        className="p-3 rounded-lg border text-sm hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        style={{
                          borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                          color: theme === 'dark' ? '#d1d5db' : '#374151'
                        }}
                      >
                        {effect}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bgm" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{
                    color: theme === 'dark' ? '#ffffff' : '#111827'
                  }}>
                    배경음악
                  </h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setBgmTemplate('library')}
                      className={`w-full p-3 rounded-lg border text-sm text-left transition-colors ${
                        bgmTemplate === 'library' ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500' : ''
                      } hover:bg-purple-50 dark:hover:bg-purple-900/20`}
                      style={{
                        borderColor: bgmTemplate === 'library' 
                          ? '#8b5cf6' 
                          : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                        color: theme === 'dark' ? '#d1d5db' : '#374151'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        <span>무료 음악 라이브러리</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setBgmTemplate('custom')}
                      className={`w-full p-3 rounded-lg border text-sm text-left transition-colors ${
                        bgmTemplate === 'custom' ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500' : ''
                      } hover:bg-purple-50 dark:hover:bg-purple-900/20`}
                      style={{
                        borderColor: bgmTemplate === 'custom' 
                          ? '#8b5cf6' 
                          : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                        color: theme === 'dark' ? '#d1d5db' : '#374151'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        <span>내 음악</span>
                      </div>
                    </button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subtitle" className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{
                    color: theme === 'dark' ? '#ffffff' : '#111827'
                  }}>
                    자막 위치
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['top', 'center', 'bottom'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setSubtitlePosition(pos)}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          subtitlePosition === pos ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500' : ''
                        } hover:bg-purple-50 dark:hover:bg-purple-900/20`}
                        style={{
                          borderColor: subtitlePosition === pos 
                            ? '#8b5cf6' 
                            : (theme === 'dark' ? '#374151' : '#e5e7eb'),
                          color: theme === 'dark' ? '#d1d5db' : '#374151'
                        }}
                      >
                        {pos === 'top' ? '상단' : pos === 'center' ? '중앙' : '하단'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2" style={{
                    color: theme === 'dark' ? '#ffffff' : '#111827'
                  }}>
                    자막 색상
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {['#ffffff', '#000000', '#ff0000', '#0000ff'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setSubtitleColor(color)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          subtitleColor === color ? 'border-purple-500' : ''
                        }`}
                        style={{
                          backgroundColor: color,
                          borderColor: subtitleColor === color ? '#8b5cf6' : (theme === 'dark' ? '#374151' : '#e5e7eb')
                        }}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
