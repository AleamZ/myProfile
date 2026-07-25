import type { CSSProperties } from 'react'
import HeroAside from '../heroAside/heroAside'
import { useLang } from '../../i18n/LanguageProvider'
import { useSceneSnapshot } from '../../scene/sceneHooks'

const NAME_LINES = ['NGUYEN', 'TIEN', 'DAT']

const HomepageBanner = () => {
    const { t } = useLang()
    const { chapter, localProgress } = useSceneSnapshot()
    const identityProgress = chapter === 'identity' ? localProgress : 1

    return (
        <section
            className="hero"
            data-scene="identity"
            style={{ '--identity-progress': identityProgress } as CSSProperties}
        >
            <div className="hero__head">
                <p className="eyebrow">
                    <span className="eyebrow__rule" aria-hidden="true" />
                    <span className="eyebrow__text">{t.roleEyebrow} — <em>react</em> · next.js</span>
                </p>
                <span className="index index--id">01&nbsp;/&nbsp;{t.sections.identity}</span>
            </div>

            <h1 className="name" aria-label="Nguyen Tien Dat">
                {NAME_LINES.map((line) => (
                    <span className="name__line" key={line}>
                        <span className="name__inner" aria-hidden="true">
                            {line.split('').map((char, i) => (
                                <span className="name__glyph" data-glyph key={`${line}-${i}`}>
                                    {char}
                                </span>
                            ))}
                        </span>
                    </span>
                ))}
            </h1>

            <HeroAside />

            <div className="name__baseline" aria-hidden="true" />
        </section>
    )
}

export default HomepageBanner
