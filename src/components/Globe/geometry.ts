/**
 * Pure geometry for the places globe. Kept free of three.js scene objects so
 * the projection maths can be tested without a renderer.
 *
 * Convention: latitude and longitude arrive in degrees, and (0°, 0°) sits on
 * the +Z axis — straight at the camera. That choice is what makes
 * `rotationForLatLng` a plain negation of the longitude instead of an offset
 * nobody can reason about later.
 *
 *   x = r · cos(lat) · sin(lng)
 *   y = r · sin(lat)
 *   z = r · cos(lat) · cos(lng)
 */

const DEG = Math.PI / 180

export type Vec3 = readonly [number, number, number]

export function latLngToVector3(lat: number, lng: number, radius = 1): Vec3 {
  const latRad = lat * DEG
  const lngRad = lng * DEG
  const ringRadius = Math.cos(latRad) * radius

  return [ringRadius * Math.sin(lngRad), Math.sin(latRad) * radius, ringRadius * Math.cos(lngRad)]
}

/**
 * The globe rotation that brings a coordinate to face the camera.
 * Derived from the convention above: rotate -lng about Y to land the point in
 * the YZ plane, then +lat about X to lift it onto +Z.
 */
export function rotationForLatLng(lat: number, lng: number): { x: number; y: number } {
  return { x: lat * DEG, y: -lng * DEG }
}

/** Shortest signed angular distance, so a globe spin never takes the long way. */
export function shortestAngle(from: number, to: number): number {
  const twoPi = Math.PI * 2
  let delta = (to - from) % twoPi
  if (delta > Math.PI) delta -= twoPi
  if (delta < -Math.PI) delta += twoPi
  return delta
}

type Ring = ReadonlyArray<readonly [number, number]>
type Polygon = ReadonlyArray<Ring>

/**
 * Coastlines as gl.LINES pairs. Rings are closed explicitly because GeoJSON
 * only sometimes repeats the first point as the last.
 *
 * `minSegmentDegrees` drops the densest runs of points: at 110m resolution the
 * raw land outline is far more detail than a 600px globe can show, and every
 * dropped vertex is a line the GPU does not draw.
 */
export function buildCoastlineSegments(
  polygons: ReadonlyArray<Polygon>,
  radius = 1,
  minSegmentDegrees = 0.6,
): Float32Array {
  const points: number[] = []
  const minSquared = minSegmentDegrees * minSegmentDegrees

  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (ring.length < 2) continue

      // Thin the ring first, always keeping the first point as the anchor.
      const kept: Array<readonly [number, number]> = [ring[0]]
      for (let index = 1; index < ring.length; index += 1) {
        const previous = kept[kept.length - 1]
        const current = ring[index]
        const dLng = current[0] - previous[0]
        const dLat = current[1] - previous[1]
        if (dLng * dLng + dLat * dLat >= minSquared) kept.push(current)
      }
      if (kept.length < 2) continue

      for (let index = 0; index < kept.length; index += 1) {
        const start = kept[index]
        const end = kept[(index + 1) % kept.length]
        // A ring that wraps the antimeridian would otherwise draw a chord
        // straight through the planet.
        if (Math.abs(end[0] - start[0]) > 180) continue

        const a = latLngToVector3(start[1], start[0], radius)
        const b = latLngToVector3(end[1], end[0], radius)
        points.push(a[0], a[1], a[2], b[0], b[1], b[2])
      }
    }
  }

  return new Float32Array(points)
}

/**
 * Expand a polyline strip into gl.LINES pairs, so arcs can share the one
 * lineSegments path the rest of the globe uses instead of introducing a
 * second draw type for four short curves.
 */
export function polylineToSegments(strip: Float32Array): Float32Array {
  const pointCount = Math.floor(strip.length / 3)
  if (pointCount < 2) return new Float32Array(0)

  const segments = new Float32Array((pointCount - 1) * 6)
  for (let index = 0; index < pointCount - 1; index += 1) {
    segments.set(strip.subarray(index * 3, index * 3 + 3), index * 6)
    segments.set(strip.subarray(index * 3 + 3, index * 3 + 6), index * 6 + 3)
  }

  return segments
}

/** Meridians and parallels — the instrument grid the coastlines sit on. */
export function buildGraticule(radius = 1, stepDegrees = 15, resolution = 4): Float32Array {
  const points: number[] = []

  const pushArc = (from: Vec3, to: Vec3) => {
    points.push(from[0], from[1], from[2], to[0], to[1], to[2])
  }

  for (let lng = -180; lng < 180; lng += stepDegrees) {
    for (let lat = -90; lat < 90; lat += resolution) {
      pushArc(latLngToVector3(lat, lng, radius), latLngToVector3(lat + resolution, lng, radius))
    }
  }

  for (let lat = -90 + stepDegrees; lat < 90; lat += stepDegrees) {
    for (let lng = -180; lng < 180; lng += resolution) {
      pushArc(latLngToVector3(lat, lng, radius), latLngToVector3(lat, lng + resolution, radius))
    }
  }

  return new Float32Array(points)
}

/**
 * A great-circle arc between two coordinates, bowed away from the surface so
 * travel between places reads as a flight path rather than a scratch on the
 * sphere. Returned as a polyline strip.
 */
export function buildArcPoints(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  radius = 1,
  segments = 48,
  lift = 0.28,
): Float32Array {
  const start = latLngToVector3(from.lat, from.lng, 1)
  const end = latLngToVector3(to.lat, to.lng, 1)
  const dot = Math.min(Math.max(start[0] * end[0] + start[1] * end[1] + start[2] * end[2], -1), 1)
  const omega = Math.acos(dot)
  const sinOmega = Math.sin(omega)
  const points = new Float32Array((segments + 1) * 3)

  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments
    // Slerp, with a straight lerp fallback for coincident or antipodal points.
    let x: number
    let y: number
    let z: number
    if (sinOmega < 1e-6) {
      x = start[0] + (end[0] - start[0]) * t
      y = start[1] + (end[1] - start[1]) * t
      z = start[2] + (end[2] - start[2]) * t
    } else {
      const a = Math.sin((1 - t) * omega) / sinOmega
      const b = Math.sin(t * omega) / sinOmega
      x = start[0] * a + end[0] * b
      y = start[1] * a + end[1] * b
      z = start[2] * a + end[2] * b
    }

    const length = Math.hypot(x, y, z) || 1
    // Highest at the midpoint, flush with the surface at both ends.
    const altitude = radius * (1 + lift * Math.sin(t * Math.PI) * (omega / Math.PI))
    const scale = altitude / length
    points[index * 3] = x * scale
    points[index * 3 + 1] = y * scale
    points[index * 3 + 2] = z * scale
  }

  return points
}
