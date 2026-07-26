import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  MathUtils,
  MeshBasicMaterial,
  Object3D,
  OctahedronGeometry,
  Vector3,
} from 'three'
import { EXPERIENCE } from '../../../data/experience'
import type { SceneQuality } from '../world.types'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

// Cut markers, not lit beads: an octahedron catches the additive blend on its
// facets and stays legible at 12px without a point light.
const MARKER_ACTIVE = '#a8e8f6'
const MARKER_IDLE = '#33445c'
const ROUTE_INK = '#9fb2c9'

const ROUTE_POINTS = EXPERIENCE.map((_, index) => {
  const progress = EXPERIENCE.length <= 1 ? 0.5 : index / (EXPERIENCE.length - 1)
  return new Vector3(
    MathUtils.lerp(-3.15, 3.15, progress),
    Math.sin(progress * Math.PI * 2.1) * 0.58 + Math.cos(progress * Math.PI) * 0.22,
    Math.sin(progress * Math.PI) * 0.32,
  )
})

function createRouteGeometry(points: Vector3[]) {
  const segmentCount = Math.max(points.length - 1, 0)
  const positions = new Float32Array(segmentCount * 2 * 3)
  const colors = new Float32Array(segmentCount * 2 * 3)

  for (let index = 0; index < segmentCount; index += 1) {
    points[index].toArray(positions, index * 6)
    points[index + 1].toArray(positions, index * 6 + 3)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  return geometry
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = MathUtils.clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1)
  return progress * progress * (3 - 2 * progress)
}

export interface ExperienceSceneProps {
  progress: number
  activeExperience: number
  quality: RenderQuality
}

export function ExperienceScene({ progress, activeExperience, quality }: ExperienceSceneProps) {
  const routeGroup = useRef<Group>(null)
  const markers = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const activeColor = useMemo(() => new Color(MARKER_ACTIVE), [])
  const idleColor = useMemo(() => new Color(MARKER_IDLE), [])
  const routeColor = useMemo(() => new Color(ROUTE_INK), [])
  const routeGeometry = useMemo(() => createRouteGeometry(ROUTE_POINTS), [])
  const markerGeometry = useMemo(
    () => new OctahedronGeometry(0.12, quality === 'high' ? 1 : 0),
    [quality],
  )
  const routeMaterial = useMemo(() => new LineBasicMaterial({
    color: '#ffffff',
    transparent: true,
    opacity: 0,
    vertexColors: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])
  const markerMaterial = useMemo(() => new MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    vertexColors: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])

  useEffect(() => {
    markers.current?.instanceMatrix.setUsage(DynamicDrawUsage)
  }, [])

  useEffect(() => () => {
    routeGeometry.dispose()
    markerGeometry.dispose()
  }, [markerGeometry, routeGeometry])

  useEffect(() => () => {
    routeMaterial.dispose()
    markerMaterial.dispose()
  }, [markerMaterial, routeMaterial])

  useFrame((_, delta) => {
    const group = routeGroup.current
    const markerInstances = markers.current
    if (!group || !markerInstances) return

    const chapterProgress = MathUtils.clamp(progress, 0, 1)
    const visibility = smoothstep(0, 0.14, chapterProgress) * (1 - smoothstep(0.84, 1, chapterProgress))
    const selected = MathUtils.clamp(Math.floor(activeExperience), 0, Math.max(EXPERIENCE.length - 1, 0))
    const routeColors = routeGeometry.getAttribute('color') as BufferAttribute
    const segmentCount = Math.max(ROUTE_POINTS.length - 1, 1)

    // The route brightens behind the visitor: travelled segments read hot, the
    // road ahead stays faint. That is the timeline doing its own signposting.
    for (let index = 0; index < ROUTE_POINTS.length - 1; index += 1) {
      const segmentProgress = smoothstep(index / segmentCount, (index + 1) / segmentCount, chapterProgress)
      const intensity = visibility * (0.12 + segmentProgress * 0.62)
      routeColors.setXYZ(index * 2, routeColor.r * intensity, routeColor.g * intensity, routeColor.b * intensity)
      routeColors.setXYZ(index * 2 + 1, routeColor.r * intensity, routeColor.g * intensity, routeColor.b * intensity)
    }
    routeColors.needsUpdate = true

    ROUTE_POINTS.forEach((point, index) => {
      const focused = index === selected
      dummy.position.copy(point)
      dummy.rotation.set(0.4, index * 0.9 + chapterProgress * 0.6, 0)
      dummy.scale.setScalar(focused ? 1.8 : 0.78 + visibility * 0.16)
      dummy.updateMatrix()
      markerInstances.setMatrixAt(index, dummy.matrix)
      markerInstances.setColorAt(index, focused ? activeColor : idleColor)
    })

    markerInstances.instanceMatrix.needsUpdate = true
    if (markerInstances.instanceColor) markerInstances.instanceColor.needsUpdate = true
    routeMaterial.opacity = MathUtils.damp(routeMaterial.opacity, visibility * 0.6, 5.2, delta)
    markerMaterial.opacity = MathUtils.damp(markerMaterial.opacity, visibility * 0.8, 5.2, delta)
    group.rotation.y = MathUtils.damp(group.rotation.y, -0.2 + chapterProgress * 0.4, 4.2, delta)
    group.rotation.z = MathUtils.damp(group.rotation.z, -0.06 + chapterProgress * 0.1, 4.2, delta)
  })

  return (
    <group ref={routeGroup} position={[0, 0.05, -0.35]}>
      <lineSegments geometry={routeGeometry} material={routeMaterial} />
      <instancedMesh ref={markers} args={[markerGeometry, markerMaterial, EXPERIENCE.length]} frustumCulled={false} />
    </group>
  )
}
