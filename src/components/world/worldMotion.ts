import type { Vector3 } from 'three'
import { CHAPTERS } from './world.types'
import type { Chapter, SceneQuality } from './world.types'

type VectorTuple = readonly [number, number, number]

interface CameraWaypoint {
  readonly chapter: Chapter
  readonly position: VectorTuple
  readonly target: VectorTuple
}

export const CAMERA_WAYPOINTS: readonly CameraWaypoint[] = [
  { chapter: 'identity', position: [0, 0, 8], target: [0, 0, 0] },
  { chapter: 'projects', position: [2.2, 0.5, 6.5], target: [0.4, 0, 0] },
  { chapter: 'experience', position: [-1.8, 0.8, 7], target: [-0.25, 0.15, 0] },
  { chapter: 'skills', position: [1.4, -0.35, 6.65], target: [0.25, -0.05, 0] },
  { chapter: 'contact', position: [-0.25, -0.5, 6.2], target: [0, -0.1, 0] },
] as const

const CORE_MOTIONS: readonly CoreMotion[] = [
  { scale: 0.92, emissiveIntensity: 2, ringX: 0.25, ringY: 0.35, ringZ: 0 },
  { scale: 1, emissiveIntensity: 2.3, ringX: 0.5, ringY: 0.8, ringZ: 0.2 },
  { scale: 1.15, emissiveIntensity: 2.8, ringX: 0.9, ringY: 1.5, ringZ: 0.3 },
  { scale: 1.05, emissiveIntensity: 2.5, ringX: 1.2, ringY: 2.05, ringZ: -0.1 },
  { scale: 1.24, emissiveIntensity: 3.15, ringX: 1.45, ringY: 2.6, ringZ: -0.35 },
] as const

function interpolate(from: number, to: number, progress: number) {
  return from + (to - from) * progress
}

export interface CoreMotion {
  scale: number
  emissiveIntensity: number
  ringX: number
  ringY: number
  ringZ: number
}

export function downgradeSceneQuality(quality: Exclude<SceneQuality, 'fallback'>): Exclude<SceneQuality, 'fallback'> {
  if (quality === 'high') return 'balanced'
  return 'low'
}

export function writeCameraWaypoint(
  chapter: Chapter,
  localProgress: number,
  position: Vector3,
  target: Vector3,
): void {
  const chapterIndex = CHAPTERS.indexOf(chapter)
  const nextIndex = Math.min(chapterIndex + 1, CAMERA_WAYPOINTS.length - 1)
  const progress = Math.min(Math.max(localProgress, 0), 1)
  const current = CAMERA_WAYPOINTS[chapterIndex]
  const next = CAMERA_WAYPOINTS[nextIndex]

  position.set(
    current.position[0] + (next.position[0] - current.position[0]) * progress,
    current.position[1] + (next.position[1] - current.position[1]) * progress,
    current.position[2] + (next.position[2] - current.position[2]) * progress,
  )
  target.set(
    current.target[0] + (next.target[0] - current.target[0]) * progress,
    current.target[1] + (next.target[1] - current.target[1]) * progress,
    current.target[2] + (next.target[2] - current.target[2]) * progress,
  )
}

export function writeCoreMotion(chapter: Chapter, localProgress: number, motion: CoreMotion): void {
  const chapterIndex = CHAPTERS.indexOf(chapter)
  const nextIndex = Math.min(chapterIndex + 1, CORE_MOTIONS.length - 1)
  const progress = Math.min(Math.max(localProgress, 0), 1)
  const current = CORE_MOTIONS[chapterIndex]
  const next = CORE_MOTIONS[nextIndex]
  motion.scale = interpolate(current.scale, next.scale, progress)
  motion.emissiveIntensity = interpolate(current.emissiveIntensity, next.emissiveIntensity, progress)
  motion.ringX = interpolate(current.ringX, next.ringX, progress)
  motion.ringY = interpolate(current.ringY, next.ringY, progress)
  motion.ringZ = interpolate(current.ringZ, next.ringZ, progress)
}
