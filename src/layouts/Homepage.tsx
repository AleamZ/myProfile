import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Frame, LangBar, Rail, Telemetry } from '../components/Frame'
import Identity from '../components/sections/Identity'
import Work from '../components/sections/Work'
import Experience from '../components/sections/Experience'
import Skills from '../components/sections/Skills'
import Contact from '../components/sections/Contact'
import { useStageDriver } from '../system/useStage'
import { trackPointerTilt } from '../system/pointer'
import { useLang } from '../i18n/LanguageProvider'

const Instrument = lazy(() => import('../components/Instrument/Instrument'))

function hasWebGL(): boolean {
    try {
        const canvas = document.createElement('canvas')
        return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
    } catch {
        return false
    }
}

function prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

const Homepage = () => {
    const { t } = useLang()
    const anchorRef = useRef<HTMLDivElement>(null)
    const [scene, setScene] = useState<'off' | 'plain' | 'bloom'>('off')

    useStageDriver()

    useEffect(() => {
        if (!hasWebGL() || prefersReducedMotion()) return
        // Bloom costs two extra passes; skip it on the machines least able to
        // absorb them rather than shipping a slideshow.
        const small = window.matchMedia('(max-width: 900px)').matches
        setScene(small ? 'plain' : 'bloom')
    }, [])

    useEffect(() => {
        if (prefersReducedMotion()) return
        return trackPointerTilt()
    }, [])

    return (
        <div className="page">
            <a className="skip-link t-data" href="#identity">{t.skip}</a>

            {/*
              The grid cell the instrument must fill. It is a real element on
              the real grid, measured every frame — which is what keeps the 3D
              locked to the layout instead of floating near it.
            */}
            <div className="instrument__anchor" ref={anchorRef} aria-hidden="true" />

            {scene !== 'off' && (
                <Suspense fallback={null}>
                    <Instrument anchor={anchorRef} bloom={scene === 'bloom'} />
                </Suspense>
            )}

            <Frame />
            <LangBar />
            <Rail />
            <Telemetry />

            {/* Holds the perspective the chapters travel through. It must not
                wrap the frame, rail, telemetry or canvas: perspective makes
                its element the containing block for position: fixed, which
                would tear all of them off the viewport. */}
            <main className="stage-space">
                <Identity />
                <Work />
                <Experience />
                <Skills />
                <Contact />
            </main>
        </div>
    )
}

export default Homepage
