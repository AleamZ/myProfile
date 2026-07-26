import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
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
import { CHAPTERS } from '../../system/chapters'
import { stage } from '../../system/stage'
import { placeInWorld } from '../../system/grid'

const INK = '#e9eef7'
const SIGNAL = '#6fe3f2'
const LENS = { distance: 8, fov: 40 }
// The widest ring is 1.55 × 1.2 in radius, so the object measures this across.
// Scaling by the core's size instead let the rings overrun their grid cell.
const EXTENT = 1.55 * 1.2 * 2

/**
 * One object for the whole page.
 *
 * Every chapter changes its attitude and charge — never its identity. The
 * previous build had five unrelated abstractions (frames, orbiting plates, a
 * route, a constellation, an aperture) which is a large part of why the page
 * never felt like one thing.
 */
const ATTITUDE = [
  { x: 0.18, y: 0.3, z: 0.0, charge: 0.5 },
  { x: 0.55, y: 0.9, z: 0.18, charge: 0.8 },
  { x: 0.95, y: 1.6, z: 0.3, charge: 1.0 },
  { x: 1.25, y: 2.2, z: -0.1, charge: 0.85 },
  { x: 1.5, y: 2.8, z: -0.35, charge: 0.6 },
] as const

function shellPositions(count: number): Float32Array {
  const positions = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count
    const y = 1 - t * 2
    const ring = Math.sqrt(Math.max(1 - y * y, 0))
    const angle = golden * i
    const radius = 1.5 + (((i * 41) % 37) / 37) * 0.5
    positions[i * 3] = Math.cos(angle) * ring * radius
    positions[i * 3 + 1] = y * radius
    positions[i * 3 + 2] = Math.sin(angle) * ring * radius
  }

  return positions
}

function useDisposable<T extends { dispose(): void }>(create: () => T): T {
  const held = useRef<T>(null)
  if (held.current === null) held.current = create()
  useEffect(() => () => held.current?.dispose(), [])
  return held.current
}

// The camera closes on the instrument across the page: 8 units out at the
// opening, 5.2 by the end. Combined with the chapters flying past it, the
// scroll reads as travel rather than as a list moving.
const DOLLY_FAR = 8
const DOLLY_NEAR = 5.2

function Gimbal({ anchor }: { anchor: RefObject<HTMLElement | null> }) {
  const root = useRef<Group>(null)
  const rings = useRef<Group>(null)
  const core = useRef<Group>(null)
  const dust = useRef<Group>(null)
  const size = useThree(({ size: viewport }) => viewport)

  const lattice = useDisposable(() => new WireframeGeometry(new IcosahedronGeometry(1, 1)))
  const ring = useDisposable(() => new TorusGeometry(1.55, 0.0035, 3, 200))
  const shell = useDisposable(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(shellPositions(520), 3))
    return geometry
  })

  const latticeInk = useDisposable(() => new LineBasicMaterial({
    color: new Color(INK), transparent: true, opacity: 0.1, blending: AdditiveBlending, depthWrite: false,
  }))
  const ringInk = useDisposable(() => new MeshBasicMaterial({
    color: new Color(SIGNAL), transparent: true, opacity: 0.4, blending: AdditiveBlending, depthWrite: false,
  }))
  const dustInk = useDisposable(() => new PointsMaterial({
    color: new Color(INK), size: 0.01, sizeAttenuation: true, transparent: true, opacity: 0.4,
    blending: AdditiveBlending, depthWrite: false,
  }))

  const attitude = useMemo(() => ({ x: 0.18, y: 0.3, z: 0, charge: 0.5 }), [])

  useFrame(({ camera }, delta) => {
    const group = root.current
    const ringGroup = rings.current
    const coreGroup = core.current
    const dustGroup = dust.current
    const node = anchor.current
    if (!group || !ringGroup || !coreGroup || !dustGroup) return

    const { reading } = stage.get()

    camera.position.z = MathUtils.damp(
      camera.position.z,
      DOLLY_FAR + (DOLLY_NEAR - DOLLY_FAR) * reading.overall,
      2.4,
      delta,
    )

    // The one binding between the two coordinate systems: the object is placed
    // where the grid says it goes, not at a number somebody liked the look of.
    // The lens distance has to be the camera's live position, or dollying it
    // would slide the object off the grid cell it is supposed to fill.
    if (node) {
      const rect = node.getBoundingClientRect()
      const placement = placeInWorld(
        { left: rect.left, width: rect.width, top: rect.top, height: rect.height },
        { width: size.width, height: size.height },
        { distance: camera.position.z, fov: LENS.fov },
      )
      group.position.x = MathUtils.damp(group.position.x, placement.x, 6, delta)
      group.position.y = MathUtils.damp(group.position.y, placement.y, 6, delta)
      const target = placement.scale > 0 ? placement.scale / EXTENT : 1
      group.scale.setScalar(MathUtils.damp(group.scale.x, target, 6, delta))
    }

    const index = Math.min(Math.max(CHAPTERS.indexOf(reading.id), 0), ATTITUDE.length - 1)
    const from = ATTITUDE[index]
    const to = ATTITUDE[Math.min(index + 1, ATTITUDE.length - 1)]
    const t = reading.local
    attitude.x = from.x + (to.x - from.x) * t
    attitude.y = from.y + (to.y - from.y) * t
    attitude.z = from.z + (to.z - from.z) * t
    attitude.charge = from.charge + (to.charge - from.charge) * t

    ringGroup.rotation.set(
      MathUtils.damp(ringGroup.rotation.x, attitude.x, 3.2, delta),
      MathUtils.damp(ringGroup.rotation.y, attitude.y, 3.2, delta),
      MathUtils.damp(ringGroup.rotation.z, attitude.z, 3.2, delta),
    )

    ringInk.opacity = MathUtils.damp(ringInk.opacity, 0.16 + attitude.charge * 0.3, 3.4, delta)
    latticeInk.opacity = MathUtils.damp(latticeInk.opacity, 0.05 + attitude.charge * 0.06, 3.4, delta)
    dustInk.opacity = MathUtils.damp(dustInk.opacity, 0.22 + attitude.charge * 0.24, 3.4, delta)

    coreGroup.rotation.y += delta * 0.22
    coreGroup.rotation.x += delta * 0.07
    dustGroup.rotation.y -= delta * 0.09
    dustGroup.rotation.x += delta * 0.03
    // A full turn of the rings across the page, on top of the per-chapter
    // attitude — the object is visibly turning at any moment you look at it.
    ringGroup.rotation.z += delta * 0.12
  })

  return (
    <group ref={root}>
      <group ref={core}>
        <lineSegments geometry={lattice} material={latticeInk} />
      </group>
      <group ref={rings}>
        <mesh geometry={ring} material={ringInk} />
        <mesh geometry={ring} material={ringInk} rotation={[Math.PI / 2.3, Math.PI / 4, 0]} scale={1.2} />
        <mesh geometry={ring} material={ringInk} rotation={[Math.PI / 1.7, -Math.PI / 5, 0.4]} scale={0.78} />
      </group>
      <group ref={dust}>
        <points geometry={shell} material={dustInk} />
      </group>
    </group>
  )
}

export interface InstrumentProps {
  /** The grid cell the object must fill. */
  anchor: RefObject<HTMLElement | null>
  bloom: boolean
}

export default function Instrument({ anchor, bloom }: InstrumentProps) {
  return (
    <Canvas
      className="instrument__canvas"
      camera={{ position: [0, 0, LENS.distance], fov: LENS.fov, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      dpr={[1, 1.6]}
    >
      <Gimbal anchor={anchor} />
      {/*
        The scene is additive hairlines, so bloom is not a filter on top — it is
        what makes them read as emitted light. The canvas is full-bleed, so the
        composer's slight lift of the whole buffer has no edge to give away.
      */}
      {bloom && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom intensity={0.5} luminanceThreshold={0.22} luminanceSmoothing={0.36} mipmapBlur />
        </EffectComposer>
      )}
    </Canvas>
  )
}
