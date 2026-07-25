import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { CHAPTERS } from './world.types'
import {
  CAMERA_WAYPOINTS,
  downgradeSceneQuality,
  writeCameraWaypoint,
  writeCoreMotion,
} from './worldMotion'

describe('downgradeSceneQuality', () => {
  it('drops exactly one render tier and never disables the CSS-enhanced world', () => {
    expect(downgradeSceneQuality('high')).toBe('balanced')
    expect(downgradeSceneQuality('balanced')).toBe('low')
    expect(downgradeSceneQuality('low')).toBe('low')
  })
})

describe('writeCameraWaypoint', () => {
  it('defines a waypoint for every chapter', () => {
    expect(CAMERA_WAYPOINTS.map(({ chapter }) => chapter)).toEqual(CHAPTERS)
  })

  it('writes an interpolated pose without replacing the caller-owned vectors', () => {
    const position = new Vector3()
    const target = new Vector3()

    writeCameraWaypoint('identity', 0.5, position, target)

    expect(position.toArray()).toEqual([1.1, 0.25, 7.25])
    expect(target.toArray()).toEqual([0.2, 0, 0])
  })

  it('clamps chapter progress before sampling the next waypoint', () => {
    const position = new Vector3()
    const target = new Vector3()

    writeCameraWaypoint('skills', 3, position, target)

    expect(position.toArray()).toEqual([-0.25, -0.5, 6.2])
    expect(target.toArray()).toEqual([0, -0.1, 0])
  })
})

describe('writeCoreMotion', () => {
  it('interpolates core scale, glow and ring orientation across chapter progress', () => {
    const motion = { scale: 0, emissiveIntensity: 0, ringX: 0, ringY: 0, ringZ: 0 }

    writeCoreMotion('projects', 0.5, motion)

    expect(motion).toEqual({
      scale: 1.075,
      emissiveIntensity: 2.55,
      ringX: 0.7,
      ringY: 1.15,
      ringZ: 0.25,
    })
  })
})
