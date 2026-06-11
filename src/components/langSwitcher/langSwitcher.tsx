import { LANGS } from '../../i18n/lang'
import { useLang } from '../../i18n/LanguageProvider'

const LangSwitcher = () => {
    const { lang, setLang } = useLang()

    return (
        <div className="lang" role="group" aria-label="Language">
            {LANGS.map((l) => (
                <button
                    key={l.code}
                    type="button"
                    data-magnetic
                    className={`lang__btn${lang === l.code ? ' is-active' : ''}`}
                    aria-pressed={lang === l.code}
                    lang={l.code}
                    onClick={() => setLang(l.code)}
                >
                    {l.label}
                </button>
            ))}
        </div>
    )
}

export default LangSwitcher
