import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  MeshBasicMaterial,
  Mesh,
  PlaneGeometry,
  PointsMaterial,
  TorusGeometry,
} from 'three'
import type { SceneQuality } from '../world.types'
import { writeIdentitySceneMotion, type IdentitySceneMotion } from '../sceneMotion'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

const ION = '#e8eef8'
const PLASMA = '#67e8f9'

const PARTICLE_COUNTS: Readonly<Record<RenderQuality, number>> = {
  high: 220,
  balanced: 120,
  low: 52,
}

// Depth dust, spread across a slab rather than a plane so parallax has
// something to bite on as the frames separate.
function createDepthParticles(count: number): BufferGeometry {
  const positions = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3
    const column = ((index * 37) % count) / Math.max(count - 1, 1)
    const row = ((index * 61) % count) / Math.max(count - 1, 1)
    const depth = ((index * 29) % count) / Math.max(count - 1, 1)
    positions[offset] = (column - 0.5) * 9.6
    positions[offset + 1] = (row - 0.5) * 6.4
    positions[offset + 2] = -2.4 + depth * 4.8
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  return geometry
}

export interface IdentitySceneProps {
  progress: number
  quality: RenderQuality
}

/**
 * Three nested alignment frames — the kind an optical bench draws to prove it
 * is in focus — pulling apart in depth as the visitor scrolls the hero. The
 * previous version filled these frames with violet wireframe planes, which read
 * as three purple sheets stacked behind the name.
 */
export function IdentityScene({ progress, quality }: IdentitySceneProps) {
  const scene = useRef<Group>(null)
  const frameBack = useRef<LineSegments>(null)
  const frameMiddle = useRef<LineSegments>(null)
  const frameFront = useRef<LineSegments>(null)
  const reticle = useRef<Mesh>(null)
  const particleGroup = useRef<Group>(null)
  const motion = useRef<IdentitySceneMotion>({ planeSeparation: 0.12, portalScale: 0.88, opacity: 0.95 })

  const frameGeometry = useMemo(() => {
    const plane = new PlaneGeometry(7.6, 5.1)
    const edges = new EdgesGeometry(plane)
    plane.dispose()
    return edges
  }, [])
  const reticleGeometry = useMemo(
    () => new TorusGeometry(2.24, 0.0035, 3, quality === 'low' ? 88 : 168),
    [quality],
  )
  const particleGeometry = useMemo(() => createDepthParticles(PARTICLE_COUNTS[quality]), [quality])

  const frameMaterials = useMemo(
    () => [0.05, 0.075, 0.1].map((opacity) => new LineBasicMaterial({
      color: new Color(ION),
      transparent: true,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
    })),
    [],
  )
  const reticleMaterial = useMemo(
    () => new MeshBasicMaterial({
      color: new Color(PLASMA),
      transparent: true,
      opacity: 0.24,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [],
  )
  const particleMaterial = useMemo(
    () => new PointsMaterial({
      color: new Color(ION),
      size: quality === 'low' ? 0.02 : 0.013,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.36,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [quality],
  )

  useEffect(() => () => {
    frameGeometry.dispose()
    reticleGeometry.dispose()
    particleGeometry.dispose()
  }, [frameGeometry, particleGeometry, reticleGeometry])

  useEffect(() => () => {
    frameMaterials.forEach((material) => material.dispose())
    reticleMaterial.dispose()
    particleMaterial.dispose()
  }, [frameMaterials, particleMaterial, reticleMaterial])

  useFrame((_, delta) => {
    writeIdentitySceneMotion(progress, motion.current)
    const back = frameBack.current
    const middle = frameMiddle.current
    const front = frameFront.current
    const reticleMesh = reticle.current
    const particles = particleGroup.current
    const root = scene.current
    if (!back || !middle || !front || !reticleMesh || !particles || !root) return

    const separation = motion.current.planeSeparation
    back.position.z = MathUtils.damp(back.position.z, -separation, 4.6, delta)
    middle.position.z = MathUtils.damp(middle.position.z, 0, 4.6, delta)
    front.position.z = MathUtils.damp(front.position.z, separation, 4.6, delta)
    back.position.x = MathUtils.damp(back.position.x, -separation * 0.26, 4.2, delta)
    front.position.x = MathUtils.damp(front.position.x, separation * 0.32, 4.2, delta)

    frameMaterials.forEach((material, index) => {
      const layerOpacity = [0.042, 0.06, 0.082][index]
      material.opacity = MathUtils.damp(material.opacity, layerOpacity * motion.current.opacity, 4.5, delta)
    })
    reticleMaterial.opacity = MathUtils.damp(reticleMaterial.opacity, 0.26 * motion.current.opacity, 4.5, delta)
    particleMaterial.opacity = MathUtils.damp(particleMaterial.opacity, 0.38 * motion.current.opacity, 4.5, delta)

    const reticleScale = MathUtils.damp(reticleMesh.scale.x, motion.current.portalScale, 4.2, delta)
    reticleMesh.scale.setScalar(reticleScale)
    reticleMesh.rotation.z += delta * 0.035
    particles.rotation.z -= delta * 0.008
    root.rotation.y = MathUtils.damp(root.rotation.y, -0.08 + progress * 0.16, 3.8, delta)
  })

  return (
    <group ref={scene} position={[-0.65, 0.05, -2.4]}>
      <lineSegments ref={frameBack} geometry={frameGeometry} material={frameMaterials[0]} rotation={[0.04, -0.08, -0.018]} />
      <lineSegments ref={frameMiddle} geometry={frameGeometry} material={frameMaterials[1]} rotation={[-0.025, 0.04, 0.012]} scale={0.92} />
      <lineSegments ref={frameFront} geometry={frameGeometry} material={frameMaterials[2]} rotation={[0.018, 0.1, -0.01]} scale={0.84} />
      <mesh ref={reticle} geometry={reticleGeometry} material={reticleMaterial} rotation={[0.18, -0.08, 0]} />
      <group ref={particleGroup}>
        <points geometry={particleGeometry} material={particleMaterial} />
      </group>
    </group>
  )
}
