// ── Minimal, dependency-free tokenizer ─────────────────────────
// Produces grayscale token classes for a JS/TS-ish syntax (also degrades
// gracefully on CSS/JSON/anything — unknown text just becomes 'plain').
// Operates on the raw string and emits {type,value} tokens; React escapes
// the values on render, so this is safe for arbitrary input.

export type TokenType = 'comment' | 'string' | 'keyword' | 'number' | 'fn' | 'plain'
export interface Token {
    type: TokenType
    value: string
}

const KEYWORDS = new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch',
    'case', 'break', 'continue', 'do', 'import', 'export', 'from', 'default', 'class',
    'extends', 'implements', 'new', 'delete', 'async', 'await', 'try', 'catch', 'finally',
    'throw', 'typeof', 'instanceof', 'in', 'of', 'this', 'super', 'yield', 'as', 'void',
    'interface', 'type', 'enum', 'public', 'private', 'protected', 'readonly', 'static',
    'namespace', 'declare', 'abstract', 'null', 'undefined', 'true', 'false',
])

const isIdentStart = (c: string) => /[A-Za-z_$]/.test(c)
const isIdent = (c: string) => /[A-Za-z0-9_$]/.test(c)
const isDigit = (c: string) => c >= '0' && c <= '9'
const isWordChar = (c: string) => /[/"'`]/.test(c) || isIdent(c)

export function tokenize(src: string): Token[] {
    const tokens: Token[] = []
    const n = src.length
    let i = 0

    while (i < n) {
        const c = src[i]

        // Line comment
        if (c === '/' && src[i + 1] === '/') {
            let j = i + 2
            while (j < n && src[j] !== '\n') j++
            tokens.push({ type: 'comment', value: src.slice(i, j) })
            i = j
            continue
        }

        // Block comment
        if (c === '/' && src[i + 1] === '*') {
            let j = i + 2
            while (j < n && !(src[j] === '*' && src[j + 1] === '/')) j++
            j = Math.min(n, j + 2)
            tokens.push({ type: 'comment', value: src.slice(i, j) })
            i = j
            continue
        }

        // String / template (no nested interpolation parsing — kept simple)
        if (c === '"' || c === "'" || c === '`') {
            const quote = c
            let j = i + 1
            while (j < n) {
                if (src[j] === '\\') { j += 2; continue }
                if (src[j] === quote) { j++; break }
                j++
            }
            tokens.push({ type: 'string', value: src.slice(i, j) })
            i = j
            continue
        }

        // Number
        if (isDigit(c) || (c === '.' && isDigit(src[i + 1] ?? ''))) {
            let j = i
            while (j < n && /[0-9a-fA-FxXeE._]/.test(src[j])) j++
            tokens.push({ type: 'number', value: src.slice(i, j) })
            i = j
            continue
        }

        // Identifier / keyword / function call
        if (isIdentStart(c)) {
            let j = i
            while (j < n && isIdent(src[j])) j++
            const word = src.slice(i, j)
            let k = j
            while (k < n && (src[k] === ' ' || src[k] === '\t')) k++
            const type: TokenType = KEYWORDS.has(word) ? 'keyword' : src[k] === '(' ? 'fn' : 'plain'
            tokens.push({ type, value: word })
            i = j
            continue
        }

        // Run of punctuation / whitespace → plain
        let j = i
        while (j < n && !isWordChar(src[j]) && !isDigit(src[j])) j++
        if (j === i) j = i + 1
        tokens.push({ type: 'plain', value: src.slice(i, j) })
        i = j
    }

    return tokens
}
