function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function interpolate(from: number, to: number, progress: number) {
  return from * (1 - progress) + to * progress
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1)
  return progress * progress * (3 - 2 * progress)
}

export interface IdentitySceneMotion {
  planeSeparation: number
  portalScale: number
  opacity: number
}

export function writeIdentitySceneMotion(progress: number, motion: IdentitySceneMotion): void {
  const clampedProgress = clamp(progress, 0, 1)
  motion.planeSeparation = interpolate(0.12, 1.4, clampedProgress)
  motion.portalScale = interpolate(0.88, 1.16, clampedProgress)
  motion.opacity = interpolate(0.95, 0.08, clampedProgress)
}

export function createProjectOrbitLayout(projectCount: number): number[] {
  const count = Math.max(0, Math.floor(projectCount))
  return Array.from({ length: count }, (_, index) => (index / count) * Math.PI * 2)
}

export interface ProjectsSceneMotion {
  rotationY: number
  opacity: number
  activeProject: number
}

export function writeProjectsSceneMotion(
  progress: number,
  activeProject: number,
  projectCount: number,
  motion: ProjectsSceneMotion,
): void {
  const clampedProgress = clamp(progress, 0, 1)
  const count = Math.max(0, Math.floor(projectCount))
  motion.activeProject = count === 0 ? 0 : clamp(Math.floor(activeProject), 0, count - 1)

  const activeAngle = count === 0 ? 0 : (motion.activeProject / count) * Math.PI * 2
  motion.rotationY = Math.PI / 2 - activeAngle + clampedProgress * 0.38

  const fadeIn = smoothstep(0, 0.16, clampedProgress)
  const fadeOut = 1 - smoothstep(0.82, 1, clampedProgress)
  motion.opacity = fadeIn * fadeOut
}
