import { describe, expect, it } from 'vitest'
import { columnWidth, placeInWorld, spanColumns, type GridMetrics } from './grid'

const metrics: GridMetrics = { frame: 40, rail: 56, gutter: 20, columns: 12, width: 1440 }

describe('columnWidth', () => {
  it('divides what is left after the chrome and the gutters', () => {
    // 1440 - 80 - 56 - 220 = 1084, over 12 columns
    expect(columnWidth(metrics)).toBeCloseTo(1084 / 12, 6)
  })

  it('never goes negative when the chrome does not fit', () => {
    expect(columnWidth({ ...metrics, width: 120 })).toBe(0)
    expect(columnWidth({ ...metrics, columns: 0 })).toBe(0)
  })
})

describe('spanColumns', () => {
  it('starts the first column just inside the frame and the rail', () => {
    expect(spanColumns(metrics, 1, 1).left).toBe(96)
  })

  it('spans the full content region across every column', () => {
    const full = spanColumns(metrics, 1, 12)
    expect(full.left).toBe(96)
    expect(full.width).toBeCloseTo(1440 - 40 * 2 - 56, 6)
  })

  it('includes the gutters between the columns it spans', () => {
    const column = columnWidth(metrics)
    const pair = spanColumns(metrics, 3, 4)
    expect(pair.width).toBeCloseTo(column * 2 + 20, 6)
  })

  it('leaves exactly one gutter between adjacent spans', () => {
    const left = spanColumns(metrics, 1, 7)
    const right = spanColumns(metrics, 8, 12)
    expect(right.left - (left.left + left.width)).toBeCloseTo(20, 6)
  })

  it('clamps requests that fall outside the grid instead of inverting', () => {
    expect(spanColumns(metrics, 0, 99)).toEqual(spanColumns(metrics, 1, 12))
    const reversed = spanColumns(metrics, 9, 4)
    expect(reversed.width).toBeGreaterThan(0)
  })
})

describe('placeInWorld', () => {
  const viewport = { width: 1440, height: 900 }
  const lens = { distance: 8, fov: 40 }

  it('puts a rect centred on screen at the world origin', () => {
    const placement = placeInWorld({ left: 620, width: 200, top: 400, height: 100 }, viewport, lens)
    expect(placement.x).toBeCloseTo(0, 6)
    expect(placement.y).toBeCloseTo(0, 6)
  })

  it('maps rightwards on screen to +x, and downwards to -y', () => {
    const right = placeInWorld({ left: 1000, width: 100, top: 400, height: 100 }, viewport, lens)
    const low = placeInWorld({ left: 620, width: 200, top: 700, height: 100 }, viewport, lens)
    expect(right.x).toBeGreaterThan(0)
    expect(low.y).toBeLessThan(0)
  })

  it('scales a full-height rect to the world height the lens actually sees', () => {
    const worldHeight = 2 * lens.distance * Math.tan((lens.fov * Math.PI) / 360)
    const placement = placeInWorld({ left: 0, width: viewport.height, top: 0, height: viewport.height }, viewport, lens)
    expect(placement.scale).toBeCloseTo(worldHeight, 6)
  })

  it('is proportional: doubling the pixel width doubles the world scale', () => {
    const single = placeInWorld({ left: 0, width: 300 }, viewport, lens)
    const double = placeInWorld({ left: 0, width: 600 }, viewport, lens)
    expect(double.scale).toBeCloseTo(single.scale * 2, 6)
  })

  it('returns a null placement for a collapsed viewport rather than dividing by zero', () => {
    expect(placeInWorld({ left: 0, width: 100 }, { width: 0, height: 0 }, lens)).toEqual({ x: 0, y: 0, scale: 0 })
  })
})
