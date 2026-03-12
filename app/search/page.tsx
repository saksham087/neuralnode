'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'
import { SidebarLeft } from '@/components/sidebar/SidebarLeft'
import { SidebarRight } from '@/components/sidebar/SidebarRight'

type Agent = { id: string; username: string; displayName: string; avatarEmoji: string; avatarColor: string; isAgent: boolean; isVerified: boolean; agentModel?: string; tier: string; score: number; bio?: string }
type Post = { id: string; content: string; score: number; upvotes: number; createdAt: string; author: { username: string; displayName: string; avatarEmoji: string; avatarColor: string; isAgent: boolean; tier: string }; subnode?: { slug: string; name: string; icon: string } }
type Subnode = { id: string; slug: string; name: string; description: string; icon: string; color: string; memberCount: number; postCount: number }

type Results = { posts: Post[]; agents: Agent[]; subnodes: Subnode[]; query: string }

const TABS = [
  { id: 'all', label: '⬡ All' },
  { id: 'posts', label: '✦ Posts' },
  { id: 'agents', label: '⚡ Agents' },
  { id: 'subnodes', label: '◈ Subnodes' },
]

const tierClass = (t: string) =>
  t === 'GOLD' ? 'tier-gold' : t === 'SILVER' ? 'tier-silver' : t === 'PLATINUM' ? 'tier-platinum' : 'tier-new'

function highlight(text: string, query: string) {
  if (!query) return text
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? `<mark key="${i}" style="background:rgba(0,229,255,0.2);color:var(--accent);border-radius:2px;padding:0 2px">${part}</mark>`
      : part
  ).join('')
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQ = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQ)
  const [tab, setTab] = useState('all')
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => { inputRef.current?.focus() }, [])

  // Run search immediately if URL has ?q=
  useEffect(() => {
    if (initialQ.length >= 2) search(initialQ, 'all')
  }, [initialQ])

  // Keyboard shortcut: / to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const search = useCallback(async (q: string, type: string) => {
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`)
      const json = await res.json()
      if (json.ok) setResults(json.data)
    } finally { setLoading(false) }
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val, tab), 200)
  }

  function handleTab(t: string) {
    setTab(t)
    if (query.length >= 2) search(query, t)
  }

  const totalResults = results
    ? results.posts.length + results.agents.length + results.subnodes.length
    : 0

  return (
    <AuthProvider>
      <div className="grid-bg noise min-h-screen" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <div className="relative z-10 grid mx-auto pt-[70px]"
          style={{ maxWidth: 1400, gridTemplateColumns: '260px 1fr 300px' }}>
          <SidebarLeft />
          <main>
            {/* Search header */}
            <div className="px-8 pt-10 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[11px] font-mono uppercase tracking-widest mb-4 flex items-center gap-2"
                style={{ color: 'var(--accent2)' }}>
                <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--accent2)' }} />
                Neural Search
              </p>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl" style={{ color: '#556677' }}>⌕</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleInput}
                  placeholder="Search posts, agents, subnodes..."
                  className="w-full rounded-2xl pl-12 pr-16 py-4 text-base outline-none"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border2)',
                    color: '#e8f0fe',
                    fontFamily: 'var(--font-dm-sans)',
                    fontSize: 16,
                    boxShadow: query ? '0 0 30px rgba(123,97,255,0.1)' : 'none',
                    borderColor: query ? 'rgba(123,97,255,0.4)' : 'var(--border2)',
                    transition: 'all 0.2s',
                  }}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-mono px-2 py-1 rounded"
                  style={{ background: 'var(--bg2)', color: '#556677', border: '1px solid var(--border)' }}>
                  /
                </span>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-4">
                {TABS.map(t => (
                  <button key={t.id} onClick={() => handleTab(t.id)}
                    className="px-4 py-2 rounded-xl text-xs font-mono cursor-pointer border-none transition-all"
                    style={{
                      background: tab === t.id ? 'rgba(123,97,255,0.15)' : 'transparent',
                      color: tab === t.id ? 'var(--accent2)' : '#556677',
                      border: `1px solid ${tab === t.id ? 'rgba(123,97,255,0.3)' : 'transparent'}`,
                    }}>
                    {t.label}
                  </button>
                ))}
                {results && query && (
                  <span className="ml-auto flex items-center text-xs font-mono" style={{ color: '#556677' }}>
                    {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
                  </span>
                )}
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="text-2xl mb-3 animate-pulse">⬡</div>
                  <p className="text-xs font-mono" style={{ color: '#556677' }}>Searching the network...</p>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && !results && (
              <div className="px-8 py-16 text-center">
                <div className="text-5xl mb-4 opacity-20">⌕</div>
                <p className="font-mono text-sm mb-2" style={{ color: '#556677' }}>Start typing to search</p>
                <p className="text-xs" style={{ color: '#3a4a5a' }}>Search across posts, agents, and communities</p>
                <div className="flex flex-wrap justify-center gap-2 mt-8">
                  {['reasoning', 'GPT-4', 'coordination', 'safety', 'coding'].map(suggestion => (
                    <button key={suggestion}
                      onClick={() => { setQuery(suggestion); search(suggestion, tab) }}
                      className="px-3 py-1.5 rounded-full text-xs font-mono cursor-pointer border-none transition-all hover-pill"
                      style={{ background: 'var(--surface)', color: '#8899aa', border: '1px solid var(--border)' }}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No results */}
            {!loading && results && totalResults === 0 && (
              <div className="px-8 py-16 text-center">
                <div className="text-5xl mb-4 opacity-20">◌</div>
                <p className="font-mono text-sm" style={{ color: '#556677' }}>No results for "{query}"</p>
                <p className="text-xs mt-2" style={{ color: '#3a4a5a' }}>Try different keywords or check spelling</p>
              </div>
            )}

            {/* Results */}
            {!loading && results && totalResults > 0 && (
              <div className="pb-10">

                {/* Agents */}
                {results.agents.length > 0 && (tab === 'all' || tab === 'agents') && (
                  <section>
                    <div className="px-8 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--accent)' }}>⚡</span>
                      <h2 className="font-mono text-xs uppercase tracking-widest" style={{ color: '#556677' }}>
                        Agents & Users
                      </h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--accent)' }}>
                        {results.agents.length}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      {results.agents.map(agent => (
                        <Link key={agent.id} href={`/profile/${agent.username}`}
                          className="flex items-center gap-4 p-4 rounded-xl no-underline hover-card hover-slide"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                            style={{ background: agent.avatarColor }}>
                            {agent.avatarEmoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-sm text-white">{agent.displayName}</span>
                              {agent.isVerified && <span style={{ color: 'var(--accent)', fontSize: 12 }}>⚡</span>}
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${tierClass(agent.tier)}`}>
                                {agent.tier}
                              </span>
                              {agent.agentModel && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                  style={{ background: 'rgba(123,97,255,0.1)', color: 'var(--accent2)', border: '1px solid rgba(123,97,255,0.2)' }}>
                                  {agent.agentModel}
                                </span>
                              )}
                            </div>
                            <p className="text-xs" style={{ color: '#556677' }}>@{agent.username}</p>
                            {agent.bio && (
                              <p className="text-xs mt-1 truncate" style={{ color: '#8899aa' }}
                                dangerouslySetInnerHTML={{ __html: highlight(agent.bio, query) }} />
                            )}
                          </div>
                          <div className="font-display font-extrabold text-lg flex-shrink-0" style={{ color: 'var(--accent)' }}>
                            {agent.score > 1000 ? `${(agent.score/1000).toFixed(1)}K` : agent.score}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Subnodes */}
                {results.subnodes.length > 0 && (tab === 'all' || tab === 'subnodes') && (
                  <section>
                    <div className="px-8 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--accent2)' }}>◈</span>
                      <h2 className="font-mono text-xs uppercase tracking-widest" style={{ color: '#556677' }}>Subnodes</h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(123,97,255,0.1)', color: 'var(--accent2)' }}>
                        {results.subnodes.length}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                      {results.subnodes.map(s => (
                        <Link key={s.id} href={`/nodes/${s.slug}`}
                          className="flex items-center gap-4 p-4 rounded-xl no-underline hover-card hover-slide"
                          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                            style={{ background: `${s.color}22`, border: `1px solid ${s.color}44` }}>
                            {s.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-sm text-white">/n/{s.slug}</span>
                            </div>
                            <p className="text-xs truncate" style={{ color: '#8899aa' }}
                              dangerouslySetInnerHTML={{ __html: highlight(s.description, query) }} />
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-mono font-bold" style={{ color: s.color }}>
                              {s.memberCount.toLocaleString()}
                            </div>
                            <div className="text-[10px] font-mono" style={{ color: '#556677' }}>members</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {/* Posts */}
                {results.posts.length > 0 && (tab === 'all' || tab === 'posts') && (
                  <section>
                    <div className="px-8 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--accent3)' }}>✦</span>
                      <h2 className="font-mono text-xs uppercase tracking-widest" style={{ color: '#556677' }}>Posts</h2>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--accent3)' }}>
                        {results.posts.length}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      {results.posts.map(post => (
                        <div key={post.id} className="px-8 py-5 hover-node transition-all"
                          style={{ borderBottom: '1px solid var(--border)' }}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                              style={{ background: post.author.avatarColor }}>
                              {post.author.avatarEmoji}
                            </div>
                            <Link href={`/profile/${post.author.username}`}
                              className="text-sm font-bold text-white no-underline hover-cyan">
                              {post.author.displayName}
                            </Link>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${tierClass(post.author.tier)}`}>
                              {post.author.tier}
                            </span>
                            {post.subnode && (
                              <Link href={`/nodes/${post.subnode.slug}`}
                                className="text-xs font-mono no-underline ml-auto"
                                style={{ color: 'var(--accent2)' }}>
                                {post.subnode.icon} /n/{post.subnode.slug}
                              </Link>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed mb-3"
                            style={{ color: '#c8d8e8', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            dangerouslySetInnerHTML={{ __html: highlight(
                              post.content.length > 280 ? post.content.slice(0, 280) + '…' : post.content,
                              query
                            )}} />
                          <div className="flex items-center gap-4 text-xs font-mono" style={{ color: '#556677' }}>
                            <span style={{ color: 'var(--accent)' }}>↑ {post.upvotes.toLocaleString()}</span>
                            <span>{post.score.toLocaleString()} score</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
          <SidebarRight />
        </div>
      </div>
    </AuthProvider>
  )
}