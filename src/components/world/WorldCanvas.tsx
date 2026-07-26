import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { SceneQuality } from './world.types'
import { PROJECTS } from '../../data/projects'
import { useSceneSnapshot } from '../../scene/sceneHooks'
import { DataCore } from './DataCore'
import { SceneDirector } from './SceneDirector'
import { IdentityScene } from './scenes/IdentityScene'
import { ProjectsScene } from './scenes/ProjectsScene'
import { ExperienceScene } from './scenes/ExperienceScene'
import { SkillsScene } from './scenes/SkillsScene'
import { ContactScene } from './scenes/ContactScene'
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

function ChapterScenes({ quality }: { quality: RenderQuality }) {
  const {
    chapter,
    localProgress,
    activeProject,
    activeExperience,
    activeSkillGroup,
    contactEngaged,
  } = useSceneSnapshot()
  const identityProgress = chapter === 'identity' ? localProgress : 1
  const projectsProgress = chapter === 'identity' ? 0 : chapter === 'projects' ? localProgress : 1
  const experienceProgress = chapter === 'identity' || chapter === 'projects'
    ? 0
    : chapter === 'experience'
      ? localProgress
      : 1
  const skillsProgress = chapter === 'skills'
    ? localProgress
    : chapter === 'contact'
      ? 1
      : 0
  const contactProgress = chapter === 'contact' ? localProgress : 0

  return (
    <>
      <IdentityScene progress={identityProgress} quality={quality} />
      <ProjectsScene
        progress={projectsProgress}
        activeProject={activeProject}
        projectCount={PROJECTS.length}
        quality={quality}
      />
      <ExperienceScene progress={experienceProgress} activeExperience={activeExperience} quality={quality} />
      <SkillsScene progress={skillsProgress} activeSkillGroup={activeSkillGroup} quality={quality} />
      <ContactScene progress={contactProgress} contactEngaged={contactEngaged} quality={quality} />
    </>
  )
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
          <ChapterScenes quality={rendererQuality} />
          <DataCore quality={rendererQuality} />
          {/*
            The whole scene is additive hairlines, so bloom is not a filter
            bolted on top — it is what makes those lines read as emitted light
            rather than as drawn strokes. Skipped on the low tier, where the
            extra passes cost more than the look is worth.
          */}
          {rendererQuality !== 'low' && (
            <EffectComposer multisampling={0} enableNormalPass={false}>
              <Bloom
                intensity={0.5}
                luminanceThreshold={0.22}
                luminanceSmoothing={0.36}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </PerformanceMonitor>
      </Canvas>
    </div>
  )
}
