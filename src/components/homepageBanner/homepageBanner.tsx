import type { CSSProperties } from 'react'
import HeroAside from '../heroAside/heroAside'
import { useLang } from '../../i18n/LanguageProvider'
import { useChapterStage } from '../../hooks/useChapterStage'

const NAME_LINES = ['NGUYEN', 'TIEN', 'DAT']

const HomepageBanner = () => {
    const { t } = useLang()
    // Writes --chapter-progress straight onto the section. Previously this
    // component subscribed to the scene snapshot and re-rendered on every
    // scroll tick just to move one number.
    const stageRef = useChapterStage<HTMLDivElement>('identity')

    return (
        <section className="hero" data-scene="identity">
            <div className="chapter-stage chapter-stage--hold chapter-stage--opening" ref={stageRef}>
                <div className="hero__grid">
                    <div className="hero__head">
                        <p className="eyebrow">
                            <span className="eyebrow__rule" aria-hidden="true" />
                            <span className="eyebrow__text">{t.roleEyebrow} — <em>react</em> · next.js</span>
                        </p>
                        <span className="index index--id">01&nbsp;/&nbsp;{t.sections.identity}</span>
                    </div>

                    {/*
                      Each line is drawn twice: a hairline outline that is always
                      there, and a solid copy inside a clipping window whose width
                      is driven by scroll. The name resolves as the visitor
                      descends — the type is the chapter's progress indicator, so
                      nothing else has to announce it. The clip lives on the
                      wrapper's overflow rather than on a mask or background-clip,
                      both of which Chromium drops on repaint.
                    */}
                    <h1 className="name" aria-label="Nguyen Tien Dat">
                        {NAME_LINES.map((line, index) => (
                            <span className="name__line" key={line} style={{ '--n': index } as CSSProperties}>
                                <span className="name__ghost" aria-hidden="true">{line}</span>
                                <span className="name__reveal" aria-hidden="true">
                                    <span className="name__fill">{line}</span>
                                </span>
                            </span>
                        ))}
                    </h1>

                    <HeroAside />

                    <div className="name__baseline" aria-hidden="true" />
                </div>
            </div>
        </section>
    )
}

export default HomepageBanner
