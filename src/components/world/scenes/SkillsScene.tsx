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
  SphereGeometry,
  Vector3,
} from 'three'
import { SKILLS } from '../../../data/skills'
import type { SceneQuality } from '../world.types'

type RenderQuality = Exclude<SceneQuality, 'fallback'>

// Stars, not beads. Additive blending does the work a point light used to,
// and the focused cluster is the only thing allowed to burn cyan.
const STAR_ACTIVE = '#a8e8f6'
const STAR_IDLE = '#7d8ca3'
const STAR_DIMMED = '#232e3d'
const CONNECTOR_INK = '#8496ad'

const NODE_LIMIT: Readonly<Record<RenderQuality, number>> = {
  high: Number.POSITIVE_INFINITY,
  balanced: 7,
  low: 4,
}

interface ConstellationNode {
  group: number
  position: Vector3
}

interface ConstellationLayout {
  anchors: Vector3[]
  nodes: ConstellationNode[]
  connectorGeometry: BufferGeometry
}

function createConstellationLayout(quality: RenderQuality): ConstellationLayout {
  const anchors = SKILLS.map((_, index) => {
    const angle = -0.72 + index * 0.5
    return new Vector3(
      MathUtils.lerp(-2.75, 2.75, index / Math.max(SKILLS.length - 1, 1)),
      Math.sin(angle * 2.2) * 1.05,
      Math.cos(angle) * 0.42,
    )
  })
  const nodes: ConstellationNode[] = []
  const connectorPoints: number[] = []

  anchors.forEach((anchor, group) => {
    const count = Math.min(SKILLS[group].items.length, NODE_LIMIT[quality])
    const groupNodes: ConstellationNode[] = []

    for (let index = 0; index < count; index += 1) {
      const angle = index * 2.399963 + group * 0.6
      const radius = 0.2 + Math.sqrt(index + 1) * 0.14
      const node = {
        group,
        position: new Vector3(
          anchor.x + Math.cos(angle) * radius,
          anchor.y + Math.sin(angle) * radius * 0.72,
          anchor.z + Math.sin(angle * 0.7) * 0.18,
        ),
      }
      nodes.push(node)
      groupNodes.push(node)
    }

    if (quality !== 'low' && groupNodes.length > 1) {
      for (let index = 1; index < groupNodes.length; index += 1) {
        groupNodes[0].position.toArray(connectorPoints, connectorPoints.length)
        groupNodes[index].position.toArray(connectorPoints, connectorPoints.length)
      }
    }
  })

  for (let index = 0; index < anchors.length - 1; index += 1) {
    anchors[index].toArray(connectorPoints, connectorPoints.length)
    anchors[index + 1].toArray(connectorPoints, connectorPoints.length)
  }

  const connectorGeometry = new BufferGeometry()
  connectorGeometry.setAttribute('position', new BufferAttribute(new Float32Array(connectorPoints), 3))
  return { anchors, nodes, connectorGeometry }
}

function smoothstep(edgeStart: number, edgeEnd: number, value: number) {
  const progress = MathUtils.clamp((value - edgeStart) / (edgeEnd - edgeStart), 0, 1)
  return progress * progress * (3 - 2 * progress)
}

export interface SkillsSceneProps {
  progress: number
  activeSkillGroup: number | null
  quality: RenderQuality
}

export function SkillsScene({ progress, activeSkillGroup, quality }: SkillsSceneProps) {
  const constellation = useRef<Group>(null)
  const points = useRef<InstancedMesh>(null)
  const layout = useMemo(() => createConstellationLayout(quality), [quality])
  const dummy = useMemo(() => new Object3D(), [])
  const activeColor = useMemo(() => new Color(STAR_ACTIVE), [])
  const idleColor = useMemo(() => new Color(STAR_IDLE), [])
  const mutedColor = useMemo(() => new Color(STAR_DIMMED), [])
  const pointGeometry = useMemo(
    () => new SphereGeometry(0.055, quality === 'high' ? 12 : quality === 'balanced' ? 8 : 6, 6),
    [quality],
  )
  const connectorMaterial = useMemo(() => new LineBasicMaterial({
    color: CONNECTOR_INK,
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])
  const pointMaterial = useMemo(() => new MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    vertexColors: true,
    blending: AdditiveBlending,
    depthWrite: false,
  }), [])

  useEffect(() => {
    points.current?.instanceMatrix.setUsage(DynamicDrawUsage)
  }, [])

  useEffect(() => () => {
    layout.connectorGeometry.dispose()
    pointGeometry.dispose()
  }, [layout, pointGeometry])

  useEffect(() => () => {
    connectorMaterial.dispose()
    pointMaterial.dispose()
  }, [connectorMaterial, pointMaterial])

  useFrame((_, delta) => {
    const group = constellation.current
    const pointInstances = points.current
    if (!group || !pointInstances) return

    const chapterProgress = MathUtils.clamp(progress, 0, 1)
    const visibility = smoothstep(0, 0.14, chapterProgress) * (1 - smoothstep(0.84, 1, chapterProgress))
    const selected = activeSkillGroup === null
      ? null
      : MathUtils.clamp(Math.floor(activeSkillGroup), 0, Math.max(SKILLS.length - 1, 0))

    layout.nodes.forEach((node, index) => {
      const focused = selected === node.group
      const dimmed = selected !== null && !focused
      dummy.position.copy(node.position)
      dummy.scale.setScalar(focused ? 1.75 : dimmed ? 0.62 : 1)
      dummy.updateMatrix()
      pointInstances.setMatrixAt(index, dummy.matrix)
      pointInstances.setColorAt(index, focused ? activeColor : dimmed ? mutedColor : idleColor)
    })

    pointInstances.instanceMatrix.needsUpdate = true
    if (pointInstances.instanceColor) pointInstances.instanceColor.needsUpdate = true
    connectorMaterial.opacity = MathUtils.damp(
      connectorMaterial.opacity,
      visibility * (selected === null ? 0.26 : 0.36),
      5,
      delta,
    )
    pointMaterial.opacity = MathUtils.damp(pointMaterial.opacity, visibility * 0.72, 5, delta)
    group.position.z = MathUtils.damp(group.position.z, -0.25 + (1 - chapterProgress) * 0.55, 4.3, delta)
    group.rotation.y = MathUtils.damp(group.rotation.y, 0.16 - chapterProgress * 0.3, 4.3, delta)
  })

  return (
    <group ref={constellation} position={[0, 0, -0.25]}>
      <lineSegments geometry={layout.connectorGeometry} material={connectorMaterial} />
      <instancedMesh ref={points} args={[pointGeometry, pointMaterial, layout.nodes.length]} frustumCulled={false} />
    </group>
  )
}
