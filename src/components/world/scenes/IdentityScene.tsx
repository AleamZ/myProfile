import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PointsMaterial,
  TorusGeometry,
} from 'three'
import { useTheme } from '../../../theme/ThemeProvider'
import type { SceneQuality } from '../world.types'
import { writeIdentitySceneMotion, type IdentitySceneMotion } from '../sceneMotion'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

const PARTICLE_COUNTS: Readonly<Record<RenderQuality, number>> = {
  high: 140,
  balanced: 78,
  low: 36,
}

function createDepthParticles(count: number): BufferGeometry {
  const positions = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    const offset = index * 3
    const column = ((index * 37) % count) / Math.max(count - 1, 1)
    const row = ((index * 61) % count) / Math.max(count - 1, 1)
    positions[offset] = (column - 0.5) * 8.4
    positions[offset + 1] = (row - 0.5) * 5.8
    positions[offset + 2] = -1.8 + ((index * 29) % count) / Math.max(count - 1, 1) * 4.2
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  return geometry
}

export interface IdentitySceneProps {
  progress: number
  quality: RenderQuality
}

export function IdentityScene({ progress, quality }: IdentitySceneProps) {
  const { theme } = useTheme()
  const scene = useRef<Group>(null)
  const planeBack = useRef<Mesh>(null)
  const planeMiddle = useRef<Mesh>(null)
  const planeFront = useRef<Mesh>(null)
  const portal = useRef<Mesh>(null)
  const particleGroup = useRef<Group>(null)
  const motion = useRef<IdentitySceneMotion>({ planeSeparation: 0.12, portalScale: 0.88, opacity: 0.95 })

  const planeGeometry = useMemo(() => new PlaneGeometry(7.2, 4.9), [])
  const portalGeometry = useMemo(
    () => new TorusGeometry(2.15, quality === 'low' ? 0.018 : 0.012, 5, quality === 'low' ? 72 : 128),
    [quality],
  )
  const particleGeometry = useMemo(() => createDepthParticles(PARTICLE_COUNTS[quality]), [quality])
  const planeMaterials = useMemo(() => [0.06, 0.085, 0.11].map((opacity) => new MeshBasicMaterial({
    color: new Color('#8679d4'),
    transparent: true,
    opacity,
    wireframe: true,
    depthWrite: false,
  })), [])
  const portalMaterial = useMemo(() => new MeshBasicMaterial({
    color: new Color('#b7b0ff'),
    transparent: true,
    opacity: 0.32,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])
  const particleMaterial = useMemo(() => new PointsMaterial({
    color: new Color('#d7dcff'),
    size: quality === 'low' ? 0.026 : 0.018,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.42,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [quality])

  useEffect(() => {
    const lightTheme = theme === 'light'
    planeMaterials.forEach((material, index) => {
      material.color.set(lightTheme ? ['#776ab4', '#8e80ca', '#a094df'][index] : ['#6559a8', '#8679d4', '#aca2ee'][index])
    })
    portalMaterial.color.set(lightTheme ? '#7766c4' : '#b7b0ff')
    particleMaterial.color.set(lightTheme ? '#6e5eb1' : '#d7dcff')
  }, [particleMaterial, planeMaterials, portalMaterial, theme])

  useEffect(() => () => {
    planeGeometry.dispose()
    portalGeometry.dispose()
    particleGeometry.dispose()
  }, [particleGeometry, planeGeometry, portalGeometry])

  useEffect(() => () => {
    planeMaterials.forEach((material) => material.dispose())
    portalMaterial.dispose()
    particleMaterial.dispose()
  }, [particleMaterial, planeMaterials, portalMaterial])

  useFrame((_, delta) => {
    writeIdentitySceneMotion(progress, motion.current)
    const back = planeBack.current
    const middle = planeMiddle.current
    const front = planeFront.current
    const portalMesh = portal.current
    const particles = particleGroup.current
    const root = scene.current
    if (!back || !middle || !front || !portalMesh || !particles || !root) return

    const separation = motion.current.planeSeparation
    back.position.z = MathUtils.damp(back.position.z, -separation, 4.6, delta)
    middle.position.z = MathUtils.damp(middle.position.z, 0, 4.6, delta)
    front.position.z = MathUtils.damp(front.position.z, separation, 4.6, delta)
    back.position.x = MathUtils.damp(back.position.x, -separation * 0.26, 4.2, delta)
    front.position.x = MathUtils.damp(front.position.x, separation * 0.32, 4.2, delta)

    planeMaterials.forEach((material, index) => {
      const layerOpacity = [0.052, 0.072, 0.095][index]
      material.opacity = MathUtils.damp(material.opacity, layerOpacity * motion.current.opacity, 4.5, delta)
    })
    portalMaterial.opacity = MathUtils.damp(portalMaterial.opacity, 0.34 * motion.current.opacity, 4.5, delta)
    particleMaterial.opacity = MathUtils.damp(particleMaterial.opacity, 0.44 * motion.current.opacity, 4.5, delta)

    const portalScale = MathUtils.damp(portalMesh.scale.x, motion.current.portalScale, 4.2, delta)
    portalMesh.scale.setScalar(portalScale)
    portalMesh.rotation.z += delta * 0.035
    particles.rotation.z -= delta * 0.008
    root.rotation.y = MathUtils.damp(root.rotation.y, -0.08 + progress * 0.16, 3.8, delta)
  })

  return (
    <group ref={scene} position={[-0.65, 0.05, -2.4]}>
      <mesh ref={planeBack} geometry={planeGeometry} material={planeMaterials[0]} rotation={[0.04, -0.08, -0.018]} />
      <mesh ref={planeMiddle} geometry={planeGeometry} material={planeMaterials[1]} rotation={[-0.025, 0.04, 0.012]} scale={0.92} />
      <mesh ref={planeFront} geometry={planeGeometry} material={planeMaterials[2]} rotation={[0.018, 0.1, -0.01]} scale={0.84} />
      <mesh ref={portal} geometry={portalGeometry} material={portalMaterial} rotation={[0.18, -0.08, 0]} />
      <group ref={particleGroup}>
        <points geometry={particleGeometry} material={particleMaterial} />
      </group>
    </group>
  )
}
