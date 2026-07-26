import type { ReactNode } from 'react'
import type { ChapterId } from '../system/chapters'
import { useChapterVar } from '../system/useStage'

export interface ChapterProps {
    id: ChapterId
    /** Two-digit running number, e.g. "02". */
    index: string
    title: string
    /** Right-hand head slot: a count, a location, a date range. */
    meta?: ReactNode
    /** The first chapter skips its arrival, the last its departure. */
    edge?: 'opening' | 'closing'
    /** Let the body use all twelve columns instead of the reading measure. */
    wide?: boolean
    /** Body does not fit one screen, so the stage must not stick. */
    tall?: boolean
    children: ReactNode
}

/**
 * Every chapter on the page is this component. Sections choose what goes in
 * the body and nothing else — the grid, the head, the rule and the arrival all
 * come from here, so they cannot drift apart from one another.
 */
const Chapter = ({ id, index, title, meta, edge, wide, tall, children }: ChapterProps) => {
    const innerRef = useChapterVar<HTMLDivElement>(id)
    const headingId = `${id}-title`

    return (
        <section
            className={`chapter${edge ? ` chapter--${edge}` : ''}${tall ? ' chapter--tall' : ''}`}
            id={id}
            data-chapter={id}
            aria-labelledby={headingId}
        >
            <div className="chapter__inner" ref={innerRef}>
                <header className="chapter__head">
                    <span className="chapter__index t-data" aria-hidden="true">{index}</span>
                    <h2 className="chapter__title t-title" id={headingId}>{title}</h2>
                    <span className="chapter__rule" aria-hidden="true" />
                    {meta ? <span className="chapter__meta t-data">{meta}</span> : null}
                </header>

                <div className={`chapter__body${wide ? ' chapter__body--wide' : ''}`}>
                    {children}
                </div>
            </div>
        </section>
    )
}

export default Chapter
