import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WorldBoundary } from './WorldBoundary'

function BrokenWorld(): never {
  throw new Error('WebGL render failed')
}

describe('WorldBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders its fallback when its child throws during rendering', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <WorldBoundary fallback={<div data-testid="fallback" />}>
        <BrokenWorld />
      </WorldBoundary>,
    )

    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })

  it('reports a render error through the optional diagnostic callback', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onError = vi.fn()

    render(
      <WorldBoundary fallback={<div data-testid="fallback" />} onError={onError}>
        <BrokenWorld />
      </WorldBoundary>,
    )

    expect(onError).toHaveBeenCalledWith(expect.any(Error))
  })
})
