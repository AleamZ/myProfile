import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useMotionCapability } from './useMotionCapability'

function MotionHarness() {
  const motionEnabled = useMotionCapability()

  return <output>{motionEnabled ? 'enabled' : 'disabled'}</output>
}

describe('useMotionCapability', () => {
  afterEach(() => {
    delete document.documentElement.dataset.bgfx
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('reacts to the saved motion preference and reduced-motion changes, then cleans up', async () => {
    let reducedMotion = false
    let changeListener: ((event: MediaQueryListEvent) => void) | undefined
    const addEventListener = vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => {
      changeListener = listener
    })
    const removeEventListener = vi.fn()
    const disconnect = vi.fn()
    const observe = vi.fn()
    let triggerMutation: (() => void) | undefined

    class MockMutationObserver {
      constructor(private readonly callback: MutationCallback) {
        triggerMutation = () => this.callback([], {} as MutationObserver)
      }
      observe = observe
      disconnect = disconnect
      takeRecords = vi.fn(() => [])
    }

    vi.stubGlobal('MutationObserver', MockMutationObserver)
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      get matches() {
        return reducedMotion
      },
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener,
      removeEventListener,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })))
    document.documentElement.dataset.bgfx = 'off'

    const { unmount } = render(<MotionHarness />)

    expect(screen.getByText('disabled')).toBeInTheDocument()

    document.documentElement.dataset.bgfx = 'on'
    act(() => triggerMutation?.())
    expect(screen.getByText('enabled')).toBeInTheDocument()

    reducedMotion = true
    act(() => changeListener?.({ matches: true } as MediaQueryListEvent))
    expect(screen.getByText('disabled')).toBeInTheDocument()

    reducedMotion = false
    act(() => changeListener?.({ matches: false } as MediaQueryListEvent))
    expect(screen.getByText('enabled')).toBeInTheDocument()

    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', changeListener)
    expect(disconnect).toHaveBeenCalledTimes(1)
  })
})
