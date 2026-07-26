/**
 * The single module.
 *
 * Everything on the page — the rail, the margins, the reading column, the
 * telemetry column and the position of the 3D instrument — is derived from
 * this one grid. That is the point: previously the DOM used a 12-column grid
 * while the 3D object sat at a hand-picked world coordinate, so the background
 * and the content could never look like parts of the same object.
 */

export interface GridMetrics {
  /** Outer margin of the instrument housing, in px. */
  frame: number
  /** Left index rail, in px. */
  rail: number
  /** Space between columns, in px. */
  gutter: number
  columns: number
  /** Viewport width, in px. */
  width: number
}

export interface ColumnSpan {
  /** Distance from the viewport's left edge, in px. */
  left: number
  width: number
}

/**
 * Width of a single column. Returns 0 rather than a negative number when the
 * chrome does not fit — a negative column silently mirrors every layout that
 * depends on it.
 */
export function columnWidth({ frame, rail, gutter, columns, width }: GridMetrics): number {
  if (columns <= 0) return 0
  const content = width - frame * 2 - rail - gutter * (columns - 1)
  return Math.max(content / columns, 0)
}

/**
 * The pixel span of columns `start`..`end`, 1-indexed and inclusive, measured
 * from the viewport's left edge. `spanColumns(g, 1, 12)` is the full content
 * region; `spanColumns(g, 8, 12)` is where the instrument lives.
 */
export function spanColumns(metrics: GridMetrics, start: number, end: number): ColumnSpan {
  const { frame, rail, gutter, columns } = metrics
  const first = Math.min(Math.max(Math.round(start), 1), columns)
  const last = Math.min(Math.max(Math.round(end), first), columns)
  const column = columnWidth(metrics)
  const origin = frame + rail

  return {
    left: origin + (first - 1) * (column + gutter),
    width: (last - first + 1) * column + (last - first) * gutter,
  }
}

export interface Viewport {
  width: number
  height: number
}

export interface CameraLens {
  /** Distance from the camera to the plane the object sits on, in world units. */
  distance: number
  /** Vertical field of view, in degrees. */
  fov: number
}

export interface WorldPlacement {
  x: number
  y: number
  /** World units that fit across the given pixel width, at this distance. */
  scale: number
}

/**
 * Converts a rectangle measured in CSS pixels into world coordinates on the
 * plane the instrument sits on, so a 3D object can be placed to fill exactly
 * the columns a DOM element occupies.
 *
 * This is the binding between the two coordinate systems. Without it, matching
 * the scene to the layout is guesswork that breaks at every breakpoint.
 */
export function placeInWorld(
  rect: { left: number; width: number; top?: number; height?: number },
  viewport: Viewport,
  lens: CameraLens,
): WorldPlacement {
  if (viewport.width <= 0 || viewport.height <= 0) return { x: 0, y: 0, scale: 0 }

  const worldHeight = 2 * lens.distance * Math.tan((lens.fov * Math.PI) / 360)
  const unitsPerPixel = worldHeight / viewport.height

  const centreX = rect.left + rect.width / 2
  const centreY = (rect.top ?? 0) + (rect.height ?? viewport.height) / 2

  return {
    // Screen origin is top-left and grows downward; world origin is the centre
    // and grows upward.
    x: (centreX - viewport.width / 2) * unitsPerPixel,
    y: (viewport.height / 2 - centreY) * unitsPerPixel,
    scale: rect.width * unitsPerPixel,
  }
}
