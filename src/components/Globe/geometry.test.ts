import { describe, expect, it } from 'vitest'
import {
  buildArcPoints,
  buildCoastlineSegments,
  buildGraticule,
  latLngToVector3,
  polylineToSegments,
  rotationForLatLng,
  shortestAngle,
} from './geometry'

const close = (value: number, expected: number) => expect(value).toBeCloseTo(expected, 6)

describe('latLngToVector3', () => {
  it('puts the origin coordinate on +Z, facing the camera', () => {
    const [x, y, z] = latLngToVector3(0, 0, 2)
    close(x, 0)
    close(y, 0)
    close(z, 2)
  })

  it('places the north pole on +Y regardless of longitude', () => {
    const [x, y, z] = latLngToVector3(90, 137, 1)
    close(x, 0)
    close(y, 1)
    close(z, 0)
  })

  it('keeps every point on the sphere', () => {
    for (const [lat, lng] of [[10.82, 106.63], [-33.9, 151.2], [64.1, -21.9]]) {
      const [x, y, z] = latLngToVector3(lat, lng, 3)
      expect(Math.hypot(x, y, z)).toBeCloseTo(3, 6)
    }
  })
})

describe('rotationForLatLng', () => {
  // The whole point of the rotation is that applying it lands the coordinate
  // on +Z. Assert the composition rather than the raw numbers.
  it('rotates a coordinate onto the camera axis', () => {
    const lat = 10.8231
    const lng = 106.6297
    const [x, y, z] = latLngToVector3(lat, lng, 1)
    const { x: rx, y: ry } = rotationForLatLng(lat, lng)

    const xAfterY = x * Math.cos(ry) + z * Math.sin(ry)
    const zAfterY = -x * Math.sin(ry) + z * Math.cos(ry)
    const yFinal = y * Math.cos(rx) - zAfterY * Math.sin(rx)
    const zFinal = y * Math.sin(rx) + zAfterY * Math.cos(rx)

    close(xAfterY, 0)
    close(yFinal, 0)
    close(zFinal, 1)
  })
})

describe('shortestAngle', () => {
  it('crosses the seam the short way instead of unwinding', () => {
    expect(shortestAngle(3.0, -3.0)).toBeCloseTo(Math.PI * 2 - 6, 6)
    expect(shortestAngle(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2, 6)
    expect(Math.abs(shortestAngle(0, Math.PI * 4))).toBeLessThan(1e-6)
  })
})

describe('buildCoastlineSegments', () => {
  const square = [[[[0, 0], [0, 10], [10, 10], [10, 0]] as const]]

  it('closes each ring back to its first point', () => {
    const positions = buildCoastlineSegments(square, 1, 0)
    // 4 edges × 2 vertices × 3 components
    expect(positions).toHaveLength(24)
  })

  it('drops segments that would cut through the planet at the antimeridian', () => {
    const wrapping = [[[[179, 0], [-179, 0]] as const]]
    expect(buildCoastlineSegments(wrapping, 1, 0)).toHaveLength(0)
  })

  it('thins dense runs of points below the minimum segment length', () => {
    const dense = [[[[0, 0], [0, 0.01], [0, 0.02], [0, 10]] as const]]
    const thinned = buildCoastlineSegments(dense, 1, 1)
    const full = buildCoastlineSegments(dense, 1, 0)
    expect(thinned.length).toBeLessThan(full.length)
  })

  it('ignores rings that cannot form a line', () => {
    expect(buildCoastlineSegments([[[[5, 5]] as const]], 1, 0)).toHaveLength(0)
  })
})

describe('polylineToSegments', () => {
  it('repeats interior points so a strip renders as connected line pairs', () => {
    const strip = new Float32Array([0, 0, 0, 1, 1, 1, 2, 2, 2])
    expect(Array.from(polylineToSegments(strip))).toEqual([0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2])
  })

  it('returns nothing for a strip that cannot form a segment', () => {
    expect(polylineToSegments(new Float32Array([1, 2, 3]))).toHaveLength(0)
  })
})

describe('buildGraticule', () => {
  it('returns paired vertices that all sit on the sphere', () => {
    const positions = buildGraticule(2, 90, 30)
    expect(positions.length % 6).toBe(0)
    for (let index = 0; index < positions.length; index += 3) {
      expect(Math.hypot(positions[index], positions[index + 1], positions[index + 2])).toBeCloseTo(2, 6)
    }
  })
})

describe('buildArcPoints', () => {
  const hcm = { lat: 10.8231, lng: 106.6297 }
  const seoul = { lat: 37.5665, lng: 126.978 }

  it('starts and ends flush with the surface', () => {
    const points = buildArcPoints(hcm, seoul, 1, 24)
    const first = Math.hypot(points[0], points[1], points[2])
    const lastIndex = points.length - 3
    const last = Math.hypot(points[lastIndex], points[lastIndex + 1], points[lastIndex + 2])

    expect(first).toBeCloseTo(1, 6)
    expect(last).toBeCloseTo(1, 6)
  })

  it('bows away from the surface in the middle', () => {
    const segments = 24
    const points = buildArcPoints(hcm, seoul, 1, segments)
    const midIndex = (segments / 2) * 3
    expect(Math.hypot(points[midIndex], points[midIndex + 1], points[midIndex + 2])).toBeGreaterThan(1)
  })

  it('degrades to a straight interpolation for coincident points', () => {
    const points = buildArcPoints(hcm, hcm, 1, 8)
    expect(points).toHaveLength(27)
    expect(Number.isNaN(points[0])).toBe(false)
  })
})
