import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import landTopology from 'world-atlas/land-110m.json'
import { GLOBE_HOME, PLACES, PLACE_ROUTES, type Place } from '../../data/places'
import {
  buildArcPoints,
  buildCoastlineSegments,
  buildGraticule,
  latLngToVector3,
  polylineToSegments,
  rotationForLatLng,
  shortestAngle,
} from './geometry'

const R = 1
const INK = '#e9eef7'
const SIGNAL = '#6fe3f2'
const NIGHT = '#080b13'

type Ring = ReadonlyArray<readonly [number, number]>
type Polygon = ReadonlyArray<Ring>

const LAND: ReadonlyArray<Polygon> = (() => {
  const topology = landTopology as unknown as Topology
  const land = feature(topology, topology.objects.land)
  const geometry = 'features' in land ? land.features[0].geometry : land.geometry
  if (geometry.type === 'MultiPolygon') return geometry.coordinates as unknown as ReadonlyArray<Polygon>
  if (geometry.type === 'Polygon') return [geometry.coordinates as unknown as Polygon]
  return []
})()

const BY_ID = new Map(PLACES.map((place) => [place.id, place]))

export interface GlobeProps {
  activeId: string | null
  onHover: (id: string | null) => void
  /** Marker position in CSS pixels, or null once it turns behind the planet. */
  onMarkerPosition: (position: { x: number; y: number } | null) => void
}

/** Builds a GPU resource once and releases it when the globe unmounts. */
function useDisposable<T extends { dispose(): void }>(create: () => T): T {
  const held = useRef<T>(null)
  if (held.current === null) held.current = create()
  useEffect(() => () => held.current?.dispose(), [])
  return held.current
}

function geometryFrom(positions: Float32Array): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  return geometry
}

function Marker({ place, active, onHover }: { place: Place; active: boolean; onHover: (id: string | null) => void }) {
  const halo = useRef<Mesh>(null)
  const position = useMemo(() => new Vector3(...latLngToVector3(place.lat, place.lng, R)), [place])
  const dotGeometry = useDisposable(() => new SphereGeometry(0.011, 12, 8))
  const haloGeometry = useDisposable(() => new SphereGeometry(0.028, 16, 10))
  const dotMaterial = useDisposable(() => new MeshBasicMaterial({
    color: new Color(SIGNAL),
    transparent: true,
    opacity: 0.95,
  }))
  const haloMaterial = useDisposable(() => new MeshBasicMaterial({
    color: new Color(SIGNAL),
    transparent: true,
    opacity: 0.16,
    blending: AdditiveBlending,
    depthWrite: false,
  }))

  useFrame((_, delta) => {
    const mesh = halo.current
    if (!mesh) return
    mesh.scale.setScalar(MathUtils.damp(mesh.scale.x, active ? 2 : 1, 6, delta))
    haloMaterial.opacity = MathUtils.damp(haloMaterial.opacity, active ? 0.42 : 0.14, 6, delta)
  })

  return (
    <group position={position}>
      {/* The halo is the pointer target; the dot alone is far too small to hit. */}
      <mesh
        ref={halo}
        geometry={haloGeometry}
        material={haloMaterial}
        onPointerOver={(event) => {
          event.stopPropagation()
          onHover(place.id)
        }}
        onPointerOut={() => onHover(null)}
      />
      <mesh geometry={dotGeometry} material={dotMaterial} />
    </group>
  )
}

function Planet({ activeId, onHover, onMarkerPosition }: GlobeProps) {
  const globe = useRef<Group>(null)
  const size = useThree(({ size: viewport }) => viewport)
  const camera = useThree(({ camera: cam }) => cam)
  const world = useMemo(() => new Vector3(), [])
  const projected = useMemo(() => new Vector3(), [])
  const drift = useRef(0)

  const coast = useDisposable(() => geometryFrom(buildCoastlineSegments(LAND, R, 0.9)))
  const grid = useDisposable(() => geometryFrom(buildGraticule(R, 20, 5)))
  const routes = useDisposable(() => {
    const chunks: Float32Array[] = []
    for (const [fromId, toId] of PLACE_ROUTES) {
      const from = BY_ID.get(fromId)
      const to = BY_ID.get(toId)
      if (from && to) chunks.push(polylineToSegments(buildArcPoints(from, to, R, 56, 0.32)))
    }
    const merged = new Float32Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return geometryFrom(merged)
  })
  // Just inside the coastlines, so the far hemisphere is hidden and the thing
  // reads as a planet rather than as a wireframe ball.
  const shell = useDisposable(() => new SphereGeometry(R * 0.992, 64, 48))

  const coastInk = useDisposable(() => new LineBasicMaterial({
    color: new Color(INK), transparent: true, opacity: 0.52,
  }))
  const gridInk = useDisposable(() => new LineBasicMaterial({
    color: new Color(INK), transparent: true, opacity: 0.07,
  }))
  const routeInk = useDisposable(() => new LineBasicMaterial({
    color: new Color(SIGNAL),
    transparent: true,
    opacity: 0.3,
    blending: AdditiveBlending,
    depthWrite: false,
  }))
  const shellInk = useDisposable(() => new MeshBasicMaterial({ color: new Color(NIGHT) }))

  useFrame((_, delta) => {
    const group = globe.current
    if (!group) return

    const active = activeId ? BY_ID.get(activeId) : undefined
    const target = active
      ? rotationForLatLng(active.lat, active.lng)
      : rotationForLatLng(GLOBE_HOME.lat, GLOBE_HOME.lng)

    // The idle drift parks while a place is being read, so the marker under
    // the cursor does not slowly crawl away from it.
    if (!active) drift.current += delta * 0.03
    const targetY = target.y + (active ? 0 : Math.sin(drift.current) * 0.15)

    group.rotation.x = MathUtils.damp(group.rotation.x, target.x, 3.4, delta)
    group.rotation.y += shortestAngle(group.rotation.y, targetY) * Math.min(delta * 3.4, 1)

    if (!active) {
      onMarkerPosition(null)
      return
    }

    group.updateMatrixWorld()
    world.set(...latLngToVector3(active.lat, active.lng, R)).applyMatrix4(group.matrixWorld)

    // The globe turns about the origin and the camera sits on +Z, so z alone
    // says which hemisphere a marker is on.
    if (world.z < R * 0.06) {
      onMarkerPosition(null)
      return
    }

    projected.copy(world).project(camera)
    onMarkerPosition({
      x: (projected.x * 0.5 + 0.5) * size.width,
      y: (-projected.y * 0.5 + 0.5) * size.height,
    })
  })

  return (
    <group ref={globe}>
      <mesh geometry={shell} material={shellInk} />
      <lineSegments geometry={grid} material={gridInk} />
      <lineSegments geometry={coast} material={coastInk} />
      <lineSegments geometry={routes} material={routeInk} />
      {PLACES.map((place) => (
        <Marker key={place.id} place={place} active={place.id === activeId} onHover={onHover} />
      ))}
    </group>
  )
}

export default function Globe(props: GlobeProps) {
  return (
    <Canvas
      className="globe__canvas"
      camera={{ position: [0, 0, 3.4], fov: 40, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
      onPointerMissed={() => props.onHover(null)}
    >
      <Planet {...props} />
    </Canvas>
  )
}
