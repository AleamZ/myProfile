import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils, Vector3 } from 'three'
import { useSceneStore } from '../../scene/sceneHooks'
import { writeCameraWaypoint } from './worldMotion'

export function SceneDirector() {
  const store = useSceneStore()
  const targetPosition = useRef(new Vector3())
  const targetLook = useRef(new Vector3())
  const dampedLook = useRef(new Vector3())
  const initialized = useRef(false)

  useFrame(({ camera }, delta) => {
    const { chapter, localProgress } = store.getState()
    writeCameraWaypoint(chapter, localProgress, targetPosition.current, targetLook.current)

    if (!initialized.current) {
      dampedLook.current.copy(targetLook.current)
      initialized.current = true
    }

    camera.position.set(
      MathUtils.damp(camera.position.x, targetPosition.current.x, 3.2, delta),
      MathUtils.damp(camera.position.y, targetPosition.current.y, 3.2, delta),
      MathUtils.damp(camera.position.z, targetPosition.current.z, 3.2, delta),
    )
    dampedLook.current.set(
      MathUtils.damp(dampedLook.current.x, targetLook.current.x, 3.6, delta),
      MathUtils.damp(dampedLook.current.y, targetLook.current.y, 3.6, delta),
      MathUtils.damp(dampedLook.current.z, targetLook.current.z, 3.6, delta),
    )
    camera.lookAt(dampedLook.current)
  })

  return null
}

