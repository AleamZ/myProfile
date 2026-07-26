import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import type { SceneQuality } from '../world.types'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

// The aperture is drawn in ice; only the point you are being invited to reach
// burns cyan. That is the whole colour budget for this chapter.
const APERTURE_INK = '#b6c6da'
const BEACON = '#8fe9f8'

export interface ContactSceneProps {
  progress: number
  contactEngaged: boolean
  quality: RenderQuality
}

export function ContactScene({ progress, contactEngaged, quality }: ContactSceneProps) {
  const portal = useRef<Group>(null)
  const outerRing = useRef<Mesh>(null)
  const middleRing = useRef<Mesh>(null)
  const innerRing = useRef<Mesh>(null)
  const core = useRef<Mesh>(null)
  const torusGeometry = useMemo(
    () => new TorusGeometry(
      1.35,
      quality === 'low' ? 0.006 : 0.004,
      3,
      quality === 'low' ? 88 : 168,
    ),
    [quality],
  )
  const coreGeometry = useMemo(
    () => new SphereGeometry(0.075, quality === 'high' ? 18 : 10, 8),
    [quality],
  )
  const ringMaterial = useMemo(() => new MeshBasicMaterial({
    color: new Color(APERTURE_INK),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])
  const coreMaterial = useMemo(() => new MeshBasicMaterial({
    color: new Color(BEACON),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])

  useEffect(() => () => {
    torusGeometry.dispose()
    coreGeometry.dispose()
  }, [coreGeometry, torusGeometry])

  useEffect(() => () => {
    ringMaterial.dispose()
    coreMaterial.dispose()
  }, [coreMaterial, ringMaterial])

  useFrame((_, delta) => {
    const group = portal.current
    const outer = outerRing.current
    const middle = middleRing.current
    const inner = innerRing.current
    const coreMesh = core.current
    if (!group || !outer || !middle || !inner || !coreMesh) return

    const chapterProgress = MathUtils.clamp(progress, 0, 1)
    const visibility = MathUtils.smoothstep(chapterProgress, 0, 0.22)
    const settle = 1 - chapterProgress
    const aperture = contactEngaged ? 1.16 : 1
    const rootScale = MathUtils.damp(group.scale.x, aperture, 5.4, delta)
    group.scale.setScalar(rootScale)
    group.position.z = MathUtils.damp(group.position.z, -0.15 + settle * 0.85, 4.8, delta)
    outer.rotation.set(
      MathUtils.damp(outer.rotation.x, 0.22 + settle * 0.72, 4.5, delta),
      MathUtils.damp(outer.rotation.y, settle * 0.58, 4.5, delta),
      MathUtils.damp(outer.rotation.z, -0.08 + settle * 0.42, 4.5, delta),
    )
    middle.rotation.set(
      MathUtils.damp(middle.rotation.x, Math.PI / 2 - settle * 0.46, 4.5, delta),
      MathUtils.damp(middle.rotation.y, 0.18 + settle * 0.65, 4.5, delta),
      MathUtils.damp(middle.rotation.z, settle * -0.32, 4.5, delta),
    )
    inner.rotation.set(
      MathUtils.damp(inner.rotation.x, 0.12 + settle * -0.48, 4.5, delta),
      MathUtils.damp(inner.rotation.y, Math.PI / 2 + settle * 0.36, 4.5, delta),
      MathUtils.damp(inner.rotation.z, 0.06 + settle * 0.5, 4.5, delta),
    )

    ringMaterial.opacity = MathUtils.damp(ringMaterial.opacity, visibility * (contactEngaged ? 0.62 : 0.4), 5.2, delta)
    coreMaterial.opacity = MathUtils.damp(coreMaterial.opacity, visibility * (contactEngaged ? 0.95 : 0.6), 5.2, delta)
    const coreScale = MathUtils.damp(coreMesh.scale.x, contactEngaged ? 1.55 : 1, 5.8, delta)
    coreMesh.scale.setScalar(coreScale)
  })

  return (
    <group ref={portal} position={[0, 0, -0.15]}>
      <mesh ref={outerRing} geometry={torusGeometry} material={ringMaterial} />
      <mesh ref={middleRing} geometry={torusGeometry} material={ringMaterial} scale={0.72} />
      <mesh ref={innerRing} geometry={torusGeometry} material={ringMaterial} scale={0.43} />
      <mesh ref={core} geometry={coreGeometry} material={coreMaterial} />
    </group>
  )
}
