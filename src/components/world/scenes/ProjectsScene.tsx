import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  DoubleSide,
  DynamicDrawUsage,
  Group,
  InstancedMesh,
  MathUtils,
  MeshBasicMaterial,
  Object3D,
  TorusGeometry,
} from 'three'
import type { SceneQuality } from '../world.types'
import {
  createProjectOrbitLayout,
  writeProjectsSceneMotion,
  type ProjectsSceneMotion,
} from '../sceneMotion'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

const ORBIT_RADIUS = 3.05

// Additive blending means colour is brightness here: the selected plate is lit
// glass, the rest are barely-there slides. Nothing is painted violet.
const PLATE_ACTIVE = '#c8e9f4'
const PLATE_IDLE_COLOR = '#26313f'
const RING_COLOR = '#8fa3bd'

export interface ProjectsSceneProps {
  progress: number
  activeProject: number
  projectCount: number
  quality: RenderQuality
}

/**
 * The work orbit: thin plates riding a hairline ring. They used to be solid
 * violet boxes lit by a point light, which is what made the section read as
 * toy blocks orbiting a marble.
 */
export function ProjectsScene({ progress, activeProject, projectCount, quality }: ProjectsSceneProps) {
  const orbitGroup = useRef<Group>(null)
  const nodes = useRef<InstancedMesh>(null)
  const motion = useRef<ProjectsSceneMotion>({ rotationY: Math.PI / 2, opacity: 0, activeProject: 0 })
  const dummy = useMemo(() => new Object3D(), [])
  const activeColor = useMemo(() => new Color(PLATE_ACTIVE), [])
  const idleColor = useMemo(() => new Color(PLATE_IDLE_COLOR), [])
  const nodeAngles = useMemo(() => createProjectOrbitLayout(projectCount), [projectCount])
  const ringGeometry = useMemo(
    () => new TorusGeometry(ORBIT_RADIUS, quality === 'low' ? 0.005 : 0.003, 3, quality === 'low' ? 96 : 176),
    [quality],
  )
  // A plate, not a block — 4mm thick at this scale, so it disappears edge-on.
  const nodeGeometry = useMemo(() => new BoxGeometry(0.46, 0.29, 0.004), [])
  const ringMaterial = useMemo(() => new MeshBasicMaterial({
    color: new Color(RING_COLOR),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])
  const nodeMaterial = useMemo(() => new MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    vertexColors: true,
    side: DoubleSide,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])

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
    if (!group || !nodeInstances) return

    group.rotation.y = MathUtils.damp(group.rotation.y, motion.current.rotationY, 4.8, delta)
    group.rotation.x = MathUtils.damp(group.rotation.x, -0.13 + progress * 0.08, 3.8, delta)
    ringMaterial.opacity = MathUtils.damp(ringMaterial.opacity, motion.current.opacity * 0.3, 4.6, delta)
    nodeMaterial.opacity = MathUtils.damp(nodeMaterial.opacity, motion.current.opacity * 0.7, 4.6, delta)

    nodeAngles.forEach((angle, index) => {
      const selected = index === motion.current.activeProject
      const radius = ORBIT_RADIUS + (selected ? 0.08 : 0)
      dummy.position.set(Math.cos(angle) * radius, Math.sin(angle * 2) * 0.16, Math.sin(angle) * radius)
      // The selected plate turns to face the camera; the rest stay tangent to
      // the orbit so they read as edges rather than as competing cards.
      dummy.rotation.set(selected ? -group.rotation.x : 0, selected ? -group.rotation.y : angle + Math.PI / 2, selected ? 0 : 0.12)
      dummy.scale.setScalar(selected ? 1.68 : 1)
      dummy.updateMatrix()
      nodeInstances.setMatrixAt(index, dummy.matrix)
      nodeInstances.setColorAt(index, selected ? activeColor : idleColor)
    })

    nodeInstances.instanceMatrix.needsUpdate = true
    if (nodeInstances.instanceColor) nodeInstances.instanceColor.needsUpdate = true
  })

  return (
    <group ref={orbitGroup} position={[0.55, -0.05, -0.85]}>
      <mesh geometry={ringGeometry} material={ringMaterial} rotation={[Math.PI / 2, 0, 0]} />
      <instancedMesh ref={nodes} args={[nodeGeometry, nodeMaterial, projectCount]} frustumCulled={false} />
    </group>
  )
}
