import { useEffect, useMemo, useRef, useState } from 'react'
import CodeViewer from './codeViewer'
import { useLang } from '../../i18n/LanguageProvider'

interface RepoSourceProps {
    repoUrl: string
    branch?: string
    entryFile?: string
}

type NodeType = 'blob' | 'tree'
interface FlatEntry {
    path: string
    type: NodeType
}
interface TreeNode {
    name: string
    path: string
    type: NodeType
    children: TreeNode[]
}
interface GitTreeResponse {
    tree?: { path: string; type: string }[]
    message?: string
}

// Skip noise / binaries the browser can't usefully display.
const SKIP_DIR = /(^|\/)(node_modules|dist|build|\.next|\.git|coverage|\.turbo)(\/|$)/i
const SKIP_FILE = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|\.env(\..*)?)$/i
const BINARY = /\.(png|jpe?g|gif|svg|webp|ico|bmp|avif|woff2?|ttf|eot|otf|mp[34]|wav|ogg|webm|mov|pdf|zip|gz|lock)$/i

function parseRepo(url: string): { owner: string; repo: string } | null {
    const m = url.match(/github\.com[/:]([^/]+)\/([^/?#]+?)(?:\.git)?\/?$/i)
    return m ? { owner: m[1], repo: m[2] } : null
}

function langFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() ?? ''
    const map: Record<string, string> = {
        tsx: 'tsx', ts: 'ts', jsx: 'jsx', js: 'js', mjs: 'js', cjs: 'js',
        json: 'json', css: 'css', scss: 'scss', sass: 'scss', less: 'less',
        html: 'html', md: 'md', mdx: 'mdx', yml: 'yaml', yaml: 'yaml', txt: 'txt',
    }
    return map[ext] ?? ext ?? 'txt'
}

function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'tree' ? -1 : 1
        return a.name.localeCompare(b.name)
    })
}

function buildTree(entries: FlatEntry[]): TreeNode[] {
    const root: TreeNode = { name: '', path: '', type: 'tree', children: [] }
    const dirs = new Map<string, TreeNode>([['', root]])

    const ensureDir = (dirPath: string): TreeNode => {
        const cached = dirs.get(dirPath)
        if (cached) return cached
        const parts = dirPath.split('/')
        const parent = ensureDir(parts.slice(0, -1).join('/'))
        const node: TreeNode = { name: parts[parts.length - 1], path: dirPath, type: 'tree', children: [] }
        parent.children.push(node)
        dirs.set(dirPath, node)
        return node
    }

    for (const e of entries) {
        if (e.type === 'tree') {
            ensureDir(e.path)
            continue
        }
        const parts = e.path.split('/')
        const parent = ensureDir(parts.slice(0, -1).join('/'))
        parent.children.push({ name: parts[parts.length - 1], path: e.path, type: 'blob', children: [] })
    }

    // Drop folders that ended up empty (only held filtered-out files), then sort.
    const prune = (node: TreeNode): boolean => {
        node.children = node.children.filter((c) => (c.type === 'blob' ? true : prune(c)))
        sortNodes(node.children)
        return node.children.length > 0
    }
    prune(root)
    return root.children
}

function pickDefault(entries: FlatEntry[], entryFile?: string): string | null {
    const files = entries.filter((e) => e.type === 'blob').map((e) => e.path)
    if (entryFile && files.includes(entryFile)) return entryFile
    const prefs = ['src/App.tsx', 'src/app/page.tsx', 'src/main.tsx', 'src/index.tsx', 'README.md', 'index.html']
    for (const p of prefs) if (files.includes(p)) return p
    return files.find((f) => /\.(tsx?|jsx?|css|scss|md)$/i.test(f)) ?? files[0] ?? null
}

const RepoSource = ({ repoUrl, branch = 'main', entryFile }: RepoSourceProps) => {
    const { t } = useLang()
    const parsed = useMemo(() => parseRepo(repoUrl), [repoUrl])

    const [tree, setTree] = useState<TreeNode[]>([])
    const [open, setOpen] = useState<Set<string>>(new Set())
    const [selected, setSelected] = useState<string | null>(null)
    const [content, setContent] = useState('')
    const [treeState, setTreeState] = useState<'loading' | 'ready' | 'error'>('loading')
    const [fileState, setFileState] = useState<'idle' | 'loading' | 'error'>('idle')
    const cache = useRef<Map<string, string>>(new Map())

    // ── Fetch the repository tree once ─────────────────────────────
    useEffect(() => {
        if (!parsed) {
            setTreeState('error')
            return
        }
        let cancelled = false
        setTreeState('loading')
        fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`)
            .then((r) => (r.ok ? (r.json() as Promise<GitTreeResponse>) : Promise.reject(new Error(String(r.status)))))
            .then((data) => {
                if (cancelled) return
                const entries: FlatEntry[] = (data.tree ?? [])
                    .filter((t): t is { path: string; type: NodeType } => t.type === 'blob' || t.type === 'tree')
                    .filter((t) => !SKIP_DIR.test(t.path))
                    .filter((t) => !(t.type === 'blob' && (BINARY.test(t.path) || SKIP_FILE.test(t.path))))
                    .map((t) => ({ path: t.path, type: t.type }))

                setTree(buildTree(entries))

                const def = pickDefault(entries, entryFile)
                if (def) {
                    const parts = def.split('/')
                    const folders = new Set<string>()
                    for (let i = 1; i < parts.length; i++) folders.add(parts.slice(0, i).join('/'))
                    setOpen(folders)
                    setSelected(def)
                }
                setTreeState('ready')
            })
            .catch(() => {
                if (!cancelled) setTreeState('error')
            })
        return () => {
            cancelled = true
        }
    }, [parsed, branch, entryFile])

    // ── Fetch the selected file (raw CDN, cached) ──────────────────
    useEffect(() => {
        if (!parsed || !selected) return
        const cached = cache.current.get(selected)
        if (cached !== undefined) {
            setContent(cached)
            setFileState('idle')
            return
        }
        let cancelled = false
        setFileState('loading')
        const rawPath = selected.split('/').map(encodeURIComponent).join('/')
        fetch(`https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${rawPath}`)
            .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
            .then((text) => {
                if (cancelled) return
                const capped =
                    text.length > 200000 ? `${text.slice(0, 200000)}\n\n/* … file truncated for preview … */` : text
                cache.current.set(selected, capped)
                setContent(capped)
                setFileState('idle')
            })
            .catch(() => {
                if (!cancelled) setFileState('error')
            })
        return () => {
            cancelled = true
        }
    }, [parsed, branch, selected])

    const toggle = (path: string) =>
        setOpen((prev) => {
            const next = new Set(prev)
            if (next.has(path)) next.delete(path)
            else next.add(path)
            return next
        })

    const renderNodes = (nodes: TreeNode[], depth: number) => (
        <ul className="repo__list">
            {nodes.map((node) =>
                node.type === 'tree' ? (
                    <li key={node.path}>
                        <button
                            type="button"
                            className="repo__dir"
                            style={{ paddingLeft: depth * 14 + 12 }}
                            aria-expanded={open.has(node.path)}
                            onClick={() => toggle(node.path)}
                        >
                            <span className="repo__caret" aria-hidden="true">{open.has(node.path) ? '▾' : '▸'}</span>
                            {node.name}
                        </button>
                        {open.has(node.path) && renderNodes(node.children, depth + 1)}
                    </li>
                ) : (
                    <li key={node.path}>
                        <button
                            type="button"
                            className={`repo__file${selected === node.path ? ' is-active' : ''}`}
                            style={{ paddingLeft: depth * 14 + 26 }}
                            aria-current={selected === node.path}
                            onClick={() => setSelected(node.path)}
                        >
                            {node.name}
                        </button>
                    </li>
                ),
            )}
        </ul>
    )

    return (
        <div className="repo">
            <div className="repo__tree">
                <div className="repo__tree-head">
                    <span>{t.repo.structure}</span>
                    <a className="repo__ext" href={repoUrl} target="_blank" rel="noreferrer">GitHub&nbsp;↗</a>
                </div>
                <div className="repo__tree-scroll">
                    {treeState === 'loading' && <div className="repo__state">{t.repo.loadingRepo}</div>}
                    {treeState === 'error' && (
                        <div className="repo__state">
                            {t.repo.treeError}{' '}
                            <a href={repoUrl} target="_blank" rel="noreferrer">{t.repo.openOnGithub}&nbsp;↗</a>
                        </div>
                    )}
                    {treeState === 'ready' && renderNodes(tree, 0)}
                </div>
            </div>

            <div className="repo__code">
                {fileState === 'loading' && <div className="repo__state">{t.repo.loadingFile}</div>}
                {fileState === 'error' && (
                    <div className="repo__state">
                        {t.repo.fileError}{' '}
                        <a href={repoUrl} target="_blank" rel="noreferrer">{t.repo.viewOnGithub}&nbsp;↗</a>
                    </div>
                )}
                {fileState === 'idle' && selected && (
                    <CodeViewer content={content} filename={selected.split('/').pop() ?? selected} language={langFromPath(selected)} />
                )}
                {fileState === 'idle' && !selected && treeState === 'ready' && (
                    <div className="repo__state">{t.repo.selectFile}</div>
                )}
            </div>
        </div>
    )
}

export default RepoSource
