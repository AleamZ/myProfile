import { useMemo } from 'react'
import { tokenize } from '../../utils/highlight'

interface CodeViewerProps {
    content: string
    filename: string
    language: string
}

const CodeViewer = ({ content, filename, language }: CodeViewerProps) => {
    const tokens = useMemo(() => (content ? tokenize(content) : []), [content])
    const lineCount = useMemo(() => (content ? content.split('\n').length : 0), [content])

    return (
        <div className="code">
            <div className="code__bar">
                <span className="code__file">{filename}</span>
                <span className="code__lang">{language}</span>
            </div>

            <div className="code__scroll">
                <pre className="code__gutter" aria-hidden="true">
                    {Array.from({ length: lineCount }, (_, n) => `${n + 1}`).join('\n')}
                </pre>
                <pre className="code__body">
                    <code>
                        {tokens.map((t, idx) => (
                            <span key={idx} className={`tok tok--${t.type}`}>
                                {t.value}
                            </span>
                        ))}
                    </code>
                </pre>
            </div>
        </div>
    )
}

export default CodeViewer
