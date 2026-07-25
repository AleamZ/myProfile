import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointsMaterial,
  TorusGeometry,
} from 'three'
import { useSceneStore } from '../../scene/sceneHooks'
import { useTheme } from '../../theme/ThemeProvider'
import type { SceneQuality } from './world.types'
import { writeCoreMotion, type CoreMotion } from './worldMotion'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

const PARTICLE_COUNTS: Readonly<Record<RenderQuality, number>> = {
  high: 900,
  balanced: 450,
  low: 160,
}

function createParticleGeometry(count: number): BufferGeometry {
  const positions = new Float32Array(count * 3)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let index = 0; index < count; index += 1) {
    const normalized = (index + 0.5) / count
    const y = 1 - normalized * 2
    const radiusAtY = Math.sqrt(1 - y * y)
    const angle = goldenAngle * index
    const haloRadius = 2.05 + ((index * 17) % 23) / 80
    const offset = index * 3
    positions[offset] = Math.cos(angle) * radiusAtY * haloRadius
    positions[offset + 1] = y * haloRadius
    positions[offset + 2] = Math.sin(angle) * radiusAtY * haloRadius
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  return geometry
}

export interface DataCoreProps {
  quality: RenderQuality
}

export function DataCore({ quality }: DataCoreProps) {
  const { theme } = useTheme()
  const store = useSceneStore()
  const coreGroup = useRef<Group>(null)
  const ringGroup = useRef<Group>(null)
  const particleGroup = useRef<Group>(null)
  const motion = useRef<CoreMotion>({
    scale: 1,
    emissiveIntensity: 2,
    ringX: 0,
    ringY: 0,
    ringZ: 0,
  })

  const coreGeometry = useMemo(
    () => new IcosahedronGeometry(1.08, quality === 'high' ? 3 : quality === 'balanced' ? 2 : 1),
    [quality],
  )
  const ringGeometry = useMemo(() => new TorusGeometry(1.55, 0.012, 6, quality === 'low' ? 72 : 128), [quality])
  const particleGeometry = useMemo(() => createParticleGeometry(PARTICLE_COUNTS[quality]), [quality])
  const coreMaterial = useMemo(
    () => new MeshStandardMaterial({
      color: new Color('#b7c7ff'),
      emissive: new Color('#6d5cff'),
      emissiveIntensity: 2,
      metalness: 0.15,
      roughness: 0.32,
      transparent: true,
      opacity: 0.88,
    }),
    [],
  )
  const ringMaterial = useMemo(
    () => new MeshBasicMaterial({
      color: new Color('#a69cff'),
      wireframe: true,
      transparent: true,
      opacity: 0.48,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [],
  )
  const particleMaterial = useMemo(
    () => new PointsMaterial({
      color: new Color('#d7dcff'),
      size: quality === 'low' ? 0.022 : 0.016,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.62,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [quality],
  )

  useEffect(() => {
    const isLight = theme === 'light'
    coreMaterial.color.set(isLight ? '#8378c7' : '#b7c7ff')
    coreMaterial.emissive.set(isLight ? '#8f7de8' : '#6d5cff')
    ringMaterial.color.set(isLight ? '#8574d6' : '#a69cff')
    particleMaterial.color.set(isLight ? '#7665c4' : '#d7dcff')
  }, [coreMaterial, particleMaterial, ringMaterial, theme])

  useEffect(() => () => {
    coreGeometry.dispose()
    ringGeometry.dispose()
    particleGeometry.dispose()
  }, [coreGeometry, particleGeometry, ringGeometry])

  useEffect(() => () => {
    coreMaterial.dispose()
    ringMaterial.dispose()
  }, [coreMaterial, ringMaterial])

  useEffect(() => () => {
    particleMaterial.dispose()
  }, [particleMaterial])

  useFrame((_, delta) => {
    const { chapter, localProgress } = store.getState()
    writeCoreMotion(chapter, localProgress, motion.current)

    const core = coreGroup.current
    const rings = ringGroup.current
    const particles = particleGroup.current
    if (!core || !rings || !particles) return

    const scale = MathUtils.damp(core.scale.x, motion.current.scale, 4.2, delta)
    core.scale.setScalar(scale)
    coreMaterial.emissiveIntensity = MathUtils.damp(
      coreMaterial.emissiveIntensity,
      motion.current.emissiveIntensity + (theme === 'light' ? -0.35 : 0),
      4,
      delta,
    )
    rings.rotation.set(
      MathUtils.damp(rings.rotation.x, motion.current.ringX, 3.5, delta),
      MathUtils.damp(rings.rotation.y, motion.current.ringY, 3.5, delta),
      MathUtils.damp(rings.rotation.z, motion.current.ringZ, 3.5, delta),
    )
    core.rotation.y += delta * 0.12
    core.rotation.x += delta * 0.035
    particles.rotation.y -= delta * 0.025
    particles.rotation.z += delta * 0.012
  })

  return (
    <group>
      <ambientLight intensity={theme === 'light' ? 1.35 : 0.65} />
      <pointLight position={[2.5, 3.2, 4]} intensity={theme === 'light' ? 4 : 6} color={theme === 'light' ? '#d9d1ff' : '#9488ff'} />
      <group ref={coreGroup}>
        <mesh geometry={coreGeometry} material={coreMaterial} />
      </group>
      <group ref={ringGroup}>
        <mesh geometry={ringGeometry} material={ringMaterial} />
        <mesh geometry={ringGeometry} material={ringMaterial} rotation={[Math.PI / 2.35, Math.PI / 4, 0]} scale={1.18} />
      </group>
      <group ref={particleGroup}>
        <points geometry={particleGeometry} material={particleMaterial} />
      </group>
    </group>
  )
}
