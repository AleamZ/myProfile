import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PointLight,
  TorusGeometry,
} from 'three'
import { useTheme } from '../../../theme/ThemeProvider'
import type { SceneQuality } from '../world.types'
import {
  createProjectOrbitLayout,
  writeProjectsSceneMotion,
  type ProjectsSceneMotion,
} from '../sceneMotion'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

const ORBIT_RADIUS = 3.05

export interface ProjectsSceneProps {
  progress: number
  activeProject: number
  projectCount: number
  quality: RenderQuality
}

export function ProjectsScene({ progress, activeProject, projectCount, quality }: ProjectsSceneProps) {
  const { theme } = useTheme()
  const orbitGroup = useRef<Group>(null)
  const nodes = useRef<InstancedMesh>(null)
  const activeLight = useRef<PointLight>(null)
  const motion = useRef<ProjectsSceneMotion>({ rotationY: Math.PI / 2, opacity: 0, activeProject: 0 })
  const dummy = useMemo(() => new Object3D(), [])
  const activeColor = useMemo(() => new Color(), [])
  const idleColor = useMemo(() => new Color(), [])
  const nodeAngles = useMemo(() => createProjectOrbitLayout(projectCount), [projectCount])
  const ringGeometry = useMemo(
    () => new TorusGeometry(ORBIT_RADIUS, quality === 'low' ? 0.014 : 0.009, 4, quality === 'low' ? 84 : 144),
    [quality],
  )
  const nodeGeometry = useMemo(() => new BoxGeometry(0.34, 0.22, 0.08), [])
  const ringMaterial = useMemo(() => new MeshBasicMaterial({
    color: new Color('#8478c9'),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])
  const nodeMaterial = useMemo(() => new MeshStandardMaterial({
    color: new Color('#ffffff'),
    emissive: new Color('#6d5cff'),
    emissiveIntensity: 0.8,
    metalness: 0.15,
    roughness: 0.34,
    transparent: true,
    opacity: 0,
    vertexColors: true,
    depthWrite: false,
  }), [])

  useEffect(() => {
    const lightTheme = theme === 'light'
    ringMaterial.color.set(lightTheme ? '#6f60b4' : '#8478c9')
    nodeMaterial.emissive.set(lightTheme ? '#7564c3' : '#6d5cff')
    activeColor.set(lightTheme ? '#4d426f' : '#f4f1ff')
    idleColor.set(lightTheme ? '#9b91c5' : '#756ca4')
  }, [activeColor, idleColor, nodeMaterial, ringMaterial, theme])

  useEffect(() => {
    nodes.current?.instanceMatrix.setUsage(DynamicDrawUsage)
  }, [])

  useEffect(() => () => {
    ringGeometry.dispose()
    nodeGeometry.dispose()
  }, [nodeGeometry, ringGeometry])

  useEffect(() => () => {
    ringMaterial.dispose()
    nodeMaterial.dispose()
  }, [nodeMaterial, ringMaterial])

  useFrame((_, delta) => {
    writeProjectsSceneMotion(progress, activeProject, projectCount, motion.current)
    const group = orbitGroup.current
    const nodeInstances = nodes.current
    const light = activeLight.current
    if (!group || !nodeInstances || !light) return

    group.rotation.y = MathUtils.damp(group.rotation.y, motion.current.rotationY, 4.8, delta)
    group.rotation.x = MathUtils.damp(group.rotation.x, -0.13 + progress * 0.08, 3.8, delta)
    ringMaterial.opacity = MathUtils.damp(ringMaterial.opacity, motion.current.opacity * 0.42, 4.6, delta)
    nodeMaterial.opacity = MathUtils.damp(nodeMaterial.opacity, motion.current.opacity * 0.88, 4.6, delta)

    nodeAngles.forEach((angle, index) => {
      const selected = index === motion.current.activeProject
      const radius = ORBIT_RADIUS + (selected ? 0.08 : 0)
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.16, Math.sin(angle) * radius)
      dummy.rotation.set(selected ? -group.rotation.x : 0, selected ? -group.rotation.y : angle + Math.PI / 2, selected ? 0 : 0.12)
      dummy.scale.setScalar(selected ? 1.72 : 1)
      dummy.updateMatrix()
      nodeInstances.setMatrixAt(index, dummy.matrix)
      nodeInstances.setColorAt(index, selected ? activeColor : idleColor)

      if (selected) light.position.copy(dummy.position)
    })

    nodeInstances.instanceMatrix.needsUpdate = true
    if (nodeInstances.instanceColor) nodeInstances.instanceColor.needsUpdate = true
    light.intensity = MathUtils.damp(light.intensity, motion.current.opacity * (theme === 'light' ? 1.4 : 2.8), 4.2, delta)
  })

  return (
    <group ref={orbitGroup} position={[0.55, -0.05, -0.85]}>
      <mesh geometry={ringGeometry} material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} />
      <instancedMesh ref={nodes} args={[nodeGeometry, nodeMaterial, projectCount]} frustumCulled={false} />
      <pointLight ref={activeLight} color={theme === 'light' ? '#8272d0' : '#a79cff'} distance={2.6} decay={2} intensity={0} />
    </group>
  )
}
