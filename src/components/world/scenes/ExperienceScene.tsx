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
  MeshStandardMaterial,
  Object3D,
  PointLight,
  SphereGeometry,
  Vector3,
} from 'three'
import { EXPERIENCE } from '../../../data/experience'
import { useTheme } from '../../../theme/ThemeProvider'
import type { SceneQuality } from '../world.types'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

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
  const { theme } = useTheme()
  const routeGroup = useRef<Group>(null)
  const markers = useRef<InstancedMesh>(null)
  const focusLight = useRef<PointLight>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const activeColor = useMemo(() => new Color(), [])
  const idleColor = useMemo(() => new Color(), [])
  const routeColor = useMemo(() => new Color(), [])
  const routeGeometry = useMemo(() => createRouteGeometry(ROUTE_POINTS), [])
  const markerGeometry = useMemo(
    () => new SphereGeometry(0.12, quality === 'high' ? 16 : quality === 'balanced' ? 12 : 8, 8),
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
  const markerMaterial = useMemo(() => new MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#7568bd',
    emissiveIntensity: 0.72,
    metalness: 0.1,
    roughness: 0.35,
    transparent: true,
    opacity: 0,
    vertexColors: true,
    depthWrite: false,
  }), [])

  useEffect(() => {
    const lightTheme = theme === 'light'
    activeColor.set(lightTheme ? '#3f365f' : '#f5f2ff')
    idleColor.set(lightTheme ? '#8b80b7' : '#665e8e')
    routeColor.set(lightTheme ? '#6657a4' : '#aea5e8')
    markerMaterial.emissive.set(lightTheme ? '#7969b8' : '#7568bd')
  }, [activeColor, idleColor, markerMaterial, routeColor, theme])

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
    const light = focusLight.current
    if (!group || !markerInstances || !light) return

    const chapterProgress = MathUtils.clamp(progress, 0, 1)
    const visibility = smoothstep(0, 0.14, chapterProgress) * (1 - smoothstep(0.84, 1, chapterProgress))
    const selected = MathUtils.clamp(Math.floor(activeExperience), 0, Math.max(EXPERIENCE.length - 1, 0))
    const routeColors = routeGeometry.getAttribute('color') as BufferAttribute
    const segmentCount = Math.max(ROUTE_POINTS.length - 1, 1)

    for (let index = 0; index < ROUTE_POINTS.length - 1; index += 1) {
      const segmentProgress = smoothstep(index / segmentCount, (index + 1) / segmentCount, chapterProgress)
      const intensity = visibility * (0.16 + segmentProgress * 0.84)
      routeColors.setXYZ(index * 2, routeColor.r * intensity, routeColor.g * intensity, routeColor.b * intensity)
      routeColors.setXYZ(index * 2 + 1, routeColor.r * intensity, routeColor.g * intensity, routeColor.b * intensity)
    }
    routeColors.needsUpdate = true

    ROUTE_POINTS.forEach((point, index) => {
      const focused = index === selected
      dummy.position.copy(point)
      dummy.scale.setScalar(focused ? 1.85 : 0.82 + visibility * 0.18)
      dummy.updateMatrix()
      markerInstances.setMatrixAt(index, dummy.matrix)
      markerInstances.setColorAt(index, focused ? activeColor : idleColor)

      if (focused) light.position.copy(point)
    })

    markerInstances.instanceMatrix.needsUpdate = true
    if (markerInstances.instanceColor) markerInstances.instanceColor.needsUpdate = true
    routeMaterial.opacity = MathUtils.damp(routeMaterial.opacity, visibility * 0.68, 5.2, delta)
    markerMaterial.opacity = MathUtils.damp(markerMaterial.opacity, visibility * 0.92, 5.2, delta)
    light.intensity = MathUtils.damp(light.intensity, visibility * (theme === 'light' ? 1.2 : 2.5), 5, delta)
    group.rotation.y = MathUtils.damp(group.rotation.y, -0.2 + chapterProgress * 0.4, 4.2, delta)
    group.rotation.z = MathUtils.damp(group.rotation.z, -0.06 + chapterProgress * 0.1, 4.2, delta)
  })

  return (
    <group ref={routeGroup} position={[0, 0.05, -0.35]}>
      <lineSegments geometry={routeGeometry} material={routeMaterial} />
      <instancedMesh ref={markers} args={[markerGeometry, markerMaterial, EXPERIENCE.length]} frustumCulled={false} />
      <pointLight
        ref={focusLight}
        color={theme === 'light' ? '#7969ba' : '#b9b0ff'}
        distance={2.2}
        decay={2}
        intensity={0}
      />
    </group>
  )
}
