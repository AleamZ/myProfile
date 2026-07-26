import { FIRST_READING, type ChapterId, type ChapterReading } from './chapters'

/**
 * What the instrument is currently reading out.
 *
 * `focus` is the one slot every chapter writes into: the project under the
 * cursor, the company being viewed, the skill group being hovered. The
 * telemetry column renders it in a fixed position, so the same readout follows
 * the reader down the whole page instead of each section inventing its own
 * status display.
 */
export interface StageFocus {
  /** Which chapter is claiming the slot. Every section mounts at once, so
   *  without this the last effect to run wipes the visible chapter's readout. */
  chapter: ChapterId
  label: string
  /** 1-based, for display. */
  index: number
  total: number
}

export interface StageState {
  reading: ChapterReading
  focus: StageFocus | null
}

type Listener = () => void

let state: StageState = { reading: FIRST_READING, focus: null }
const listeners = new Set<Listener>()

function commit(next: StageState) {
  state = next
  listeners.forEach((listener) => listener())
}

// A module singleton rather than a context: there is exactly one instrument on
// exactly one page, and threading a provider through only adds ceremony. The
// arithmetic it holds is tested separately in chapters.ts.
export const stage = {
  get: (): StageState => state,

  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  setReading(reading: ChapterReading) {
    const current = state.reading
    if (current.id === reading.id && current.local === reading.local && current.overall === reading.overall) return
    commit({ ...state, reading })
  },

  setFocus(focus: StageFocus | null) {
    const current = state.focus
    if (current === focus) return
    if (
      current && focus
      && current.chapter === focus.chapter
      && current.label === focus.label
      && current.index === focus.index
      && current.total === focus.total
    ) return
    commit({ ...state, focus })
  },

  /** Test seam. */
  reset() {
    state = { reading: FIRST_READING, focus: null }
    listeners.clear()
  },
}
