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
  polylineToSegments,
  rotationForLatLng,
  shortestAngle,
} from './globeGeometry'

const RADIUS = 1
const ION = '#e8eef8'
const PLASMA = '#67e8f9'
const NIGHT = '#070b15'

type Ring = ReadonlyArray<readonly [number, number]>
type Polygon = ReadonlyArray<Ring>

// world-atlas ships a MultiPolygon of every landmass. Converting once at module
// scope keeps it off the render path — the section can mount and unmount freely.
const LAND_POLYGONS: ReadonlyArray<Polygon> = (() => {
  const land = feature(landTopology as unknown as Topology, (landTopology as unknown as Topology).objects.land)
  const geometry = 'features' in land ? land.features[0].geometry : land.geometry
  if (geometry.type === 'MultiPolygon') return geometry.coordinates as unknown as ReadonlyArray<Polygon>
  if (geometry.type === 'Polygon') return [geometry.coordinates as unknown as Polygon]
  return []
})()

const PLACE_BY_ID = new Map(PLACES.map((place) => [place.id, place]))

export interface GlobeCanvasProps {
  activeId: string | null
  onHover: (id: string | null) => void
  /**
   * Called each frame with the active marker's position in CSS pixels, or null
   * when it has rotated behind the planet. The consumer writes it straight to
   * a style so the photo card can track the marker without re-rendering React
   * sixty times a second.
   */
  onMarkerScreenPosition: (position: { x: number; y: number } | null) => void
  reducedMotion: boolean
}

function useDisposable<T extends { dispose(): void }>(factory: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps)
  useEffect(() => () => value.dispose(), [value])
  return value
}

function positionsToGeometry(positions: Float32Array): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  return geometry
}

function Marker({
  place,
  active,
  dimmed,
  onHover,
}: {
  place: Place
  active: boolean
  dimmed: boolean
  onHover: (id: string | null) => void
}) {
  const halo = useRef<Mesh>(null)
  const position = useMemo(() => new Vector3(...latLng(place)), [place])

  const dotGeometry = useDisposable(() => new SphereGeometry(0.012, 12, 8), [])
  const haloGeometry = useDisposable(() => new SphereGeometry(0.03, 16, 10), [])
  const dotMaterial = useDisposable(
    () => new MeshBasicMaterial({ color: new Color(PLASMA), transparent: true, opacity: 0.95 }),
    [],
  )
  const haloMaterial = useDisposable(
    () => new MeshBasicMaterial({
      color: new Color(PLASMA),
      transparent: true,
      opacity: 0.18,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [],
  )

  useFrame((_, delta) => {
    const haloMesh = halo.current
    if (!haloMesh) return
    const target = active ? 1.9 : 1
    haloMesh.scale.setScalar(MathUtils.damp(haloMesh.scale.x, target, 6, delta))
    haloMaterial.opacity = MathUtils.damp(haloMaterial.opacity, active ? 0.4 : dimmed ? 0.06 : 0.16, 6, delta)
    dotMaterial.opacity = MathUtils.damp(dotMaterial.opacity, dimmed && !active ? 0.35 : 0.95, 6, delta)
  })

  return (
    <group position={position}>
      {/* The halo doubles as the pointer target — the dot alone is too small to hit. */}
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

function latLng(place: Place): [number, number, number] {
  const DEG = Math.PI / 180
  const latRad = place.lat * DEG
  const lngRad = place.lng * DEG
  const ring = Math.cos(latRad) * RADIUS
  return [ring * Math.sin(lngRad), Math.sin(latRad) * RADIUS, ring * Math.cos(lngRad)]
}

function Globe({ activeId, onHover, onMarkerScreenPosition, reducedMotion }: GlobeCanvasProps) {
  const globe = useRef<Group>(null)
  const size = useThree(({ size: viewport }) => viewport)
  const camera = useThree(({ camera: cam }) => cam)
  const worldPosition = useMemo(() => new Vector3(), [])
  const projected = useMemo(() => new Vector3(), [])
  const drift = useRef(0)

  const coastlineGeometry = useDisposable(
    () => positionsToGeometry(buildCoastlineSegments(LAND_POLYGONS, RADIUS, 0.9)),
    [],
  )
  const graticuleGeometry = useDisposable(() => positionsToGeometry(buildGraticule(RADIUS, 20, 5)), [])
  const routeGeometry = useDisposable(() => {
    const chunks: Float32Array[] = []
    for (const [fromId, toId] of PLACE_ROUTES) {
      const from = PLACE_BY_ID.get(fromId)
      const to = PLACE_BY_ID.get(toId)
      if (!from || !to) continue
      chunks.push(polylineToSegments(buildArcPoints(from, to, RADIUS, 56, 0.34)))
    }
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const merged = new Float32Array(total)
    let offset = 0
    for (const chunk of chunks) {
      merged.set(chunk, offset)
      offset += chunk.length
    }
    return positionsToGeometry(merged)
  }, [])
  // Slightly inside the coastlines so it hides the far hemisphere. Without it
  // the globe reads as a wireframe ball rather than a planet.
  const occluderGeometry = useDisposable(() => new SphereGeometry(RADIUS * 0.992, 64, 48), [])

  const coastlineMaterial = useDisposable(
    () => new LineBasicMaterial({ color: new Color(ION), transparent: true, opacity: 0.5 }),
    [],
  )
  const graticuleMaterial = useDisposable(
    () => new LineBasicMaterial({ color: new Color(ION), transparent: true, opacity: 0.07 }),
    [],
  )
  const routeMaterial = useDisposable(
    () => new LineBasicMaterial({
      color: new Color(PLASMA),
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
    [],
  )
  const occluderMaterial = useDisposable(() => new MeshBasicMaterial({ color: new Color(NIGHT) }), [])

  useFrame((_, delta) => {
    const group = globe.current
    if (!group) return

    const active = activeId ? PLACE_BY_ID.get(activeId) : undefined
    const target = active
      ? rotationForLatLng(active.lat, active.lng)
      : rotationForLatLng(GLOBE_HOME.lat, GLOBE_HOME.lng)

    // A slow idle drift, parked whenever a place is being inspected so the
    // marker the visitor is reading does not crawl out from under the cursor.
    if (!reducedMotion && !active) drift.current += delta * 0.035
    const targetY = target.y + (active ? 0 : Math.sin(drift.current) * 0.16)

    group.rotation.x = MathUtils.damp(group.rotation.x, target.x, 3.4, delta)
    group.rotation.y += shortestAngle(group.rotation.y, targetY) * Math.min(delta * 3.4, 1)

    if (!active) {
      onMarkerScreenPosition(null)
      return
    }

    group.updateMatrixWorld()
    worldPosition.set(...latLng(active)).applyMatrix4(group.matrixWorld)

    // The globe spins about the origin and the camera sits on +Z, so the sign
    // of z alone says whether this marker is on the near hemisphere. Behind the
    // planet the dot is occluded, and the card must go with it.
    if (worldPosition.z < RADIUS * 0.06) {
      onMarkerScreenPosition(null)
      return
    }

    projected.copy(worldPosition).project(camera)
    onMarkerScreenPosition({
      x: (projected.x * 0.5 + 0.5) * size.width,
      y: (-projected.y * 0.5 + 0.5) * size.height,
    })
  })

  return (
    <group ref={globe}>
      <mesh geometry={occluderGeometry} material={occluderMaterial} />
      <lineSegments geometry={graticuleGeometry} material={graticuleMaterial} />
      <lineSegments geometry={coastlineGeometry} material={coastlineMaterial} />
      <lineSegments geometry={routeGeometry} material={routeMaterial} />
      {PLACES.map((place) => (
        <Marker
          key={place.id}
          place={place}
          active={place.id === activeId}
          dimmed={activeId !== null}
          onHover={onHover}
        />
      ))}
    </group>
  )
}

export default function GlobeCanvas(props: GlobeCanvasProps) {
  return (
    <Canvas
      className="globe__canvas"
      camera={{ position: [0, 0, 3.45], fov: 40, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.75]}
      onPointerMissed={() => props.onHover(null)}
    >
      <Globe {...props} />
    </Canvas>
  )
}
