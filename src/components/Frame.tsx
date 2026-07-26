import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { CHAPTERS, type ChapterId } from '../system/chapters'
import { scrollTargetForChapter, useStageState } from '../system/useStage'
import { useLang } from '../i18n/LanguageProvider'
import { LANGS } from '../i18n/lang'

/** The housing. Fixed, hairline, with machined corners. */
export const Frame = () => (
    <div className="frame" aria-hidden="true">
        <span className="frame__tick" />
        <span className="frame__tick" />
        <span className="frame__tick" />
        <span className="frame__tick" />
    </div>
)

/** The one control on the page, set into the top edge of the housing. */
export const LangBar = () => {
    const { lang, setLang } = useLang()

    return (
        <div className="langbar" role="group" aria-label="Language">
            {LANGS.map(({ code, label }) => (
                <button
                    key={code}
                    type="button"
                    className={`langbar__btn t-data${code === lang ? ' is-active' : ''}`}
                    aria-pressed={code === lang}
                    onClick={() => setLang(code)}
                >
                    {label}
                </button>
            ))}
        </div>
    )
}

const RAIL_INDEX: Record<ChapterId, string> = {
    identity: '01',
    work: '02',
    experience: '03',
    skills: '04',
    contact: '05',
}

/**
 * Chapter index down the left edge. Doubles as the page's navigation.
 *
 * Jumping straight to a chapter's top edge — the browser's default for a hash
 * link — lands mid-arrival: dim, tipped away, a third of size. `scrollTo`
 * targets the point just past that ramp instead, so a jump shows the chapter
 * already standing still. The href is kept so the link still works with
 * JavaScript disabled, and so middle-click / open-in-new-tab still resolve.
 */
export const Rail = () => {
    const { t } = useLang()
    const { reading } = useStageState()
    const labels: Record<ChapterId, string> = {
        identity: t.sections.identity,
        work: t.sections.work,
        experience: t.sections.experience,
        skills: t.sections.skills,
        contact: t.sections.contact,
    }

    return (
        <nav className="rail" aria-label="Chapters">
            {CHAPTERS.map((id) => (
                <a
                    key={id}
                    className="rail__item t-data"
                    href={`#${id}`}
                    aria-current={id === reading.id ? 'true' : undefined}
                    aria-label={labels[id]}
                    onClick={(event) => {
                        const target = scrollTargetForChapter(id)
                        if (target === null) return
                        event.preventDefault()
                        window.scrollTo({ top: target, behavior: 'smooth' })
                        window.history.replaceState(null, '', `#${id}`)
                    }}
                >
                    {RAIL_INDEX[id]}
                </a>
            ))}
        </nav>
    )
}

const clock = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
})

function useLocalTime(): string {
    const [time, setTime] = useState(() => clock.format(new Date()))

    useEffect(() => {
        const id = window.setInterval(() => setTime(clock.format(new Date())), 1000)
        return () => window.clearInterval(id)
    }, [])

    return time
}

/**
 * The readout. Four slots that never move and never change meaning; only their
 * values change as the reader descends. This is what carries continuity across
 * chapters that are otherwise about completely different things.
 */
export const Telemetry = () => {
    const { t } = useLang()
    const { reading, focus: claimed } = useStageState()
    const time = useLocalTime()
    // A focus written by a chapter the reader has already left is stale.
    const focus = claimed && claimed.chapter === reading.id ? claimed : null
    const labels: Record<ChapterId, string> = {
        identity: t.sections.identity,
        work: t.sections.work,
        experience: t.sections.experience,
        skills: t.sections.skills,
        contact: t.sections.contact,
    }

    return (
        <aside className="tele" aria-hidden="true" style={{ '--overall': reading.overall } as CSSProperties}>
            <div className="tele__slot">
                <span className="tele__label t-data">{t.tele.chapter}</span>
                <span className="tele__value tele__value--signal">
                    {RAIL_INDEX[reading.id]} / 05
                </span>
            </div>

            <div className="tele__slot">
                <span className="tele__label t-data">{t.tele.section}</span>
                <span className="tele__value">{labels[reading.id]}</span>
            </div>

            <div className="tele__slot">
                <span className="tele__label t-data">{t.tele.focus}</span>
                <span className="tele__value">{focus ? focus.label : '——'}</span>
            </div>

            <div className="tele__slot">
                <span className="tele__label t-data">{focus ? t.tele.item : t.tele.time}</span>
                <span className="tele__value">
                    {focus
                        ? `${focus.index.toString().padStart(3, '0')} / ${focus.total.toString().padStart(3, '0')}`
                        : time}
                </span>
            </div>

            <div className="tele__meter">
                <span />
            </div>
        </aside>
    )
}
