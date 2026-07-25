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

    class MockMutationObserver {
      constructor(private readonly callback: MutationCallback) {}
      observe = observe
      disconnect = disconnect
      takeRecords = vi.fn(() => [])
      trigger() {
        this.callback([], this as unknown as MutationObserver)
      }
    }

    let mutationObserver: MockMutationObserver | undefined
    vi.stubGlobal('MutationObserver', class extends MockMutationObserver {
      constructor(callback: MutationCallback) {
        super(callback)
        mutationObserver = this
      }
    })
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
    act(() => mutationObserver?.trigger())
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
