import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import type { SceneQuality } from './world.types'
import { DataCore } from './DataCore'
import { SceneDirector } from './SceneDirector'
import { downgradeSceneQuality } from './worldMotion'
import { listenForWebGLContextLoss } from './worldReadiness'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

interface WorldCanvasProps {
  quality: RenderQuality
  onFirstFrame?: () => void
  onUnavailable?: () => void
}

function ContextLossHandler({ onUnavailable }: { onUnavailable?: () => void }) {
  const canvas = useThree(({ gl }) => gl.domElement)

  useEffect(() => {
    if (!onUnavailable) return
    return listenForWebGLContextLoss(canvas, onUnavailable)
  }, [canvas, onUnavailable])

  return null
}

function RendererLifecycle({ visible }: { visible: boolean }) {
  const invalidate = useThree(({ invalidate: invalidateFrame }) => invalidateFrame)

  useEffect(() => {
    if (visible) invalidate()
  }, [invalidate, visible])

  return null
}

function FirstFrameSignal({ onFirstFrame }: { onFirstFrame?: () => void }) {
  const reported = useRef(false)

  useFrame(() => {
    if (reported.current) return
    reported.current = true
    onFirstFrame?.()
  })

  return null
}

function useDocumentVisibility() {
  const [visible, setVisible] = useState(() => !document.hidden)

  useEffect(() => {
    const onVisibilityChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return visible
}

function dprForQuality(quality: RenderQuality): number | [number, number] {
  if (quality === 'high') return [1, 1.75]
  if (quality === 'balanced') return [1, 1.35]
  return 1
}

export default function WorldCanvas({ quality, onFirstFrame, onUnavailable }: WorldCanvasProps) {
  const [rendererQuality, setRendererQuality] = useState(quality)
  const hasDowngraded = useRef(false)
  const visible = useDocumentVisibility()
  const gl = useMemo(
    () => ({ antialias: rendererQuality !== 'low', alpha: true, powerPreference: 'high-performance' as const }),
    [rendererQuality],
  )
  const onPerformanceChange = useCallback(({ factor }: { factor: number }) => {
    if (factor >= 0.45 || hasDowngraded.current) return
    hasDowngraded.current = true
    setRendererQuality((current) => downgradeSceneQuality(current))
  }, [])

  return (
    <div className="world-canvas" aria-hidden="true">
      <Canvas
        aria-hidden="true"
        dpr={dprForQuality(rendererQuality)}
        camera={{ position: [0, 0, 8], fov: 42, near: 0.1, far: 120 }}
        gl={gl}
        frameloop={visible ? 'always' : 'never'}
      >
        <PerformanceMonitor onChange={onPerformanceChange}>
          <RendererLifecycle visible={visible} />
          <ContextLossHandler onUnavailable={onUnavailable} />
          <FirstFrameSignal onFirstFrame={onFirstFrame} />
          <SceneDirector />
          <DataCore quality={rendererQuality} />
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
