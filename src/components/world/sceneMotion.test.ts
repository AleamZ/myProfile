import { describe, expect, it } from 'vitest'
import {
  createProjectOrbitLayout,
  writeIdentitySceneMotion,
  writeProjectsSceneMotion,
} from './sceneMotion'

describe('writeIdentitySceneMotion', () => {
  it('separates the depth planes while handing the chapter back to readable DOM', () => {
    const motion = { planeSeparation: 0, portalScale: 0, opacity: 0 }

    writeIdentitySceneMotion(0.5, motion)

    expect(motion.planeSeparation).toBeCloseTo(0.76)
    expect(motion.portalScale).toBeCloseTo(1.02)
    expect(motion.opacity).toBeCloseTo(0.515)
  })

  it('clamps progress before deriving scene motion', () => {
    const before = { planeSeparation: 0, portalScale: 0, opacity: 0 }
    const after = { planeSeparation: 0, portalScale: 0, opacity: 0 }

    writeIdentitySceneMotion(-2, before)
    writeIdentitySceneMotion(3, after)

    expect(before).toEqual({ planeSeparation: 0.12, portalScale: 0.88, opacity: 0.95 })
    expect(after).toEqual({ planeSeparation: 1.4, portalScale: 1.16, opacity: 0.08 })
  })
})

describe('createProjectOrbitLayout', () => {
  it('places exactly one evenly spaced node per project', () => {
    expect(createProjectOrbitLayout(4)).toEqual([0, Math.PI / 2, Math.PI, Math.PI * 1.5])
    expect(createProjectOrbitLayout(0)).toEqual([])
  })
})

describe('writeProjectsSceneMotion', () => {
  it('rotates the active project to the camera-facing point during the hold phase', () => {
    const motion = { rotationY: 0, opacity: 0, activeProject: 0 }

    writeProjectsSceneMotion(0.5, 3, 4, motion)

    expect(motion.activeProject).toBe(3)
    expect(motion.rotationY).toBeCloseTo(-Math.PI + 0.19)
    expect(motion.opacity).toBe(1)
  })

  it('clamps an invalid active index and fades outside the project hold', () => {
    const before = { rotationY: 0, opacity: 1, activeProject: 0 }
    const after = { rotationY: 0, opacity: 1, activeProject: 0 }

    writeProjectsSceneMotion(-1, -4, 7, before)
    writeProjectsSceneMotion(2, 99, 7, after)

    expect(before.activeProject).toBe(0)
    expect(before.opacity).toBe(0)
    expect(after.activeProject).toBe(6)
    expect(after.opacity).toBe(0)
  })
})
