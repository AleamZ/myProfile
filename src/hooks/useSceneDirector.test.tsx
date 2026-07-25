import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SceneProvider } from '../scene/SceneProvider'
import { useSceneSnapshot } from '../scene/sceneHooks'
import { useSceneDirector } from './useSceneDirector'

const { registerPlugin, create } = vi.hoisted(() => ({
  registerPlugin: vi.fn(),
  create: vi.fn(),
}))

vi.mock('gsap', () => ({
  gsap: { registerPlugin },
}))

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create },
}))

function DirectorHarness() {
  useSceneDirector()
  const scene = useSceneSnapshot()

  return <output data-testid="chapter">{scene.chapter}</output>
}

describe('useSceneDirector', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('routes document scroll progress into the scene store and cleans up its trigger', () => {
    const kill = vi.fn()
    let onUpdate: ((self: { progress: number }) => void) | undefined
    create.mockImplementation((config) => {
      onUpdate = config.onUpdate
      return { kill }
    })

    const { getByTestId, unmount } = render(
      <SceneProvider>
        <div className="homepage">
          <DirectorHarness />
        </div>
      </SceneProvider>,
    )

    expect(registerPlugin).toHaveBeenCalledWith(expect.anything())
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      trigger: '.homepage',
      start: 'top top',
      end: 'bottom bottom',
    }))

    act(() => onUpdate?.({ progress: 0.5 }))
    expect(getByTestId('chapter')).toHaveTextContent('experience')

    unmount()
    expect(kill).toHaveBeenCalledTimes(1)
  })
})
