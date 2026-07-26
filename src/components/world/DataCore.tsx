import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  PointsMaterial,
  TorusGeometry,
  WireframeGeometry,
} from 'three'
import { useSceneStore } from '../../scene/sceneHooks'
import type { SceneQuality } from './world.types'
import { writeCoreMotion, type CoreMotion } from './worldMotion'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

// The core is drawn, not modelled: a hairline lattice, a shell of dust and two
// razor rings. Nothing here is a solid surface, so the type in front of it is
// never competing with a lit mass.
const ION = '#e8eef8'
const PLASMA = '#67e8f9'

const SHELL_COUNTS: Readonly<Record<RenderQuality, number>> = {
  high: 1400,
  balanced: 720,
  low: 260,
}

const LATTICE_DETAIL: Readonly<Record<RenderQuality, number>> = {
  high: 2,
  balanced: 1,
  low: 1,
}

const RING_SEGMENTS: Readonly<Record<RenderQuality, number>> = {
  high: 220,
  balanced: 160,
  low: 96,
}

// A fibonacci shell, thinned toward the poles so the silhouette reads as a
// sphere of dust rather than a banded globe.
function createShellGeometry(count: number): BufferGeometry {
  const positions = new Float32Array(count * 3)
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let index = 0; index < count; index += 1) {
    const normalized = (index + 0.5) / count
    const y = 1 - normalized * 2
    const radiusAtY = Math.sqrt(Math.max(1 - y * y, 0))
    const angle = goldenAngle * index
    // Deterministic jitter keeps the shell from looking machine-perfect.
    const drift = ((index * 41) % 37) / 37
    const shellRadius = 1.62 + drift * 0.46
    const offset = index * 3
    positions[offset] = Math.cos(angle) * radiusAtY * shellRadius
    positions[offset + 1] = y * shellRadius
    positions[offset + 2] = Math.sin(angle) * radiusAtY * shellRadius
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  return geometry
}

export interface DataCoreProps {
  quality: RenderQuality
}

export function DataCore({ quality }: DataCoreProps) {
  const store = useSceneStore()
  const coreGroup = useRef<Group>(null)
  const ringGroup = useRef<Group>(null)
  const shellGroup = useRef<Group>(null)
  const motion = useRef<CoreMotion>({
    scale: 1,
    emissiveIntensity: 2,
    ringX: 0,
    ringY: 0,
    ringZ: 0,
  })

  const latticeGeometry = useMemo(
    () => new WireframeGeometry(new IcosahedronGeometry(1.12, LATTICE_DETAIL[quality])),
    [quality],
  )
  // Tube radius is a hairline at this camera distance — the old 0.012 ring read
  // as a solid white hoop across the whole frame.
  const ringGeometry = useMemo(
    () => new TorusGeometry(1.72, 0.0035, 3, RING_SEGMENTS[quality]),
    [quality],
  )
  const shellGeometry = useMemo(() => createShellGeometry(SHELL_COUNTS[quality]), [quality])

  const latticeMaterial = useMemo(
    () => new LineBasicMaterial({
      color: new Color(ION),
      transparent: true,
      opacity: 0.14,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [],
  )
  const ringMaterial = useMemo(
    () => new MeshBasicMaterial({
      color: new Color(PLASMA),
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [],
  )
  const shellMaterial = useMemo(
    () => new PointsMaterial({
      color: new Color(ION),
      size: quality === 'low' ? 0.016 : 0.0105,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [quality],
  )

  useEffect(() => () => {
    latticeGeometry.dispose()
    ringGeometry.dispose()
    shellGeometry.dispose()
  }, [latticeGeometry, ringGeometry, shellGeometry])

  useEffect(() => () => {
    latticeMaterial.dispose()
    ringMaterial.dispose()
  }, [latticeMaterial, ringMaterial])

  useEffect(() => () => {
    shellMaterial.dispose()
  }, [shellMaterial])

  useFrame((_, delta) => {
    const { chapter, localProgress } = store.getState()
    writeCoreMotion(chapter, localProgress, motion.current)

    const core = coreGroup.current
    const rings = ringGroup.current
    const shell = shellGroup.current
    if (!core || !rings || !shell) return

    const scale = MathUtils.damp(core.scale.x, motion.current.scale, 4.2, delta)
    core.scale.setScalar(scale)
    shell.scale.setScalar(MathUtils.damp(shell.scale.x, motion.current.scale, 3.6, delta))

    // The old emissive ramp lit a solid ball. Here the same signal drives how
    // hot the hairlines burn, which is the only "brightness" the core has.
    const charge = motion.current.emissiveIntensity / 2
    latticeMaterial.opacity = MathUtils.damp(latticeMaterial.opacity, 0.07 + charge * 0.075, 3.6, delta)
    ringMaterial.opacity = MathUtils.damp(ringMaterial.opacity, 0.26 + charge * 0.3, 3.6, delta)
    shellMaterial.opacity = MathUtils.damp(shellMaterial.opacity, 0.3 + charge * 0.26, 3.6, delta)

    rings.rotation.set(
      MathUtils.damp(rings.rotation.x, motion.current.ringX, 3.5, delta),
      MathUtils.damp(rings.rotation.y, motion.current.ringY, 3.5, delta),
      MathUtils.damp(rings.rotation.z, motion.current.ringZ, 3.5, delta),
    )
    core.rotation.y += delta * 0.055
    core.rotation.x += delta * 0.018
    shell.rotation.y -= delta * 0.02
    shell.rotation.z += delta * 0.008
  })

  // Held off-axis to the right and scaled well down: the reading column runs
  // down the left of the viewport, and at full size the rings spanned nearly
  // the whole frame by the closing chapters.
  return (
    <group position={[1.9, 0.2, -1.1]} scale={0.6}>
      <group ref={coreGroup}>
        <lineSegments geometry={latticeGeometry} material={latticeMaterial} />
      </group>
      <group ref={ringGroup}>
        <mesh geometry={ringGeometry} material={ringMaterial} />
        <mesh
          geometry={ringGeometry}
          material={ringMaterial}
          rotation={[Math.PI / 2.35, Math.PI / 4, 0]}
          scale={1.24}
        />
      </group>
      <group ref={shellGroup}>
        <points geometry={shellGeometry} material={shellMaterial} />
      </group>
    </group>
  )
}
