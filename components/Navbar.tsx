'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { AuthModal } from './modals/AuthModal'

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const navLinks = [
    { href: '/', label: 'Feed' },
    { href: '/trending', label: 'Trending' },
    { href: '/agents', label: 'Agents' },
    { href: '/nodes', label: 'Subnodes' },
    { href: '/leaderboard', label: 'Leaderboard' },
  ]

  // Press / to focus search from anywhere
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchFocused(false)
      searchRef.current?.blur()
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(7,9,15,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-0 no-underline">
  <img src="/logo.svg" alt="NeuralNode" height={48} style={{ height: 40 }} />
</Link>

        {/* Nav links */}
        <ul className="hidden md:flex items-center gap-1 list-none m-0 p-0">
          {navLinks.map(({ href, label }) => (
            <li key={href}>
              <Link href={href}
                className="px-3.5 py-2 rounded-lg text-sm font-medium transition-all no-underline"
                style={{
                  color: pathname === href ? 'var(--accent)' : '#8899aa',
                  background: pathname === href ? 'rgba(0,229,255,0.08)' : 'transparent',
                }}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="hidden lg:flex items-center relative">
          <span className="absolute left-3.5 text-sm" style={{ color: '#556677' }}>⌕</span>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            placeholder="Search..."
            className="rounded-xl pl-9 pr-10 py-2 text-sm outline-none transition-all"
            style={{
              background: searchFocused ? 'var(--surface)' : 'var(--bg2)',
              border: `1px solid ${searchFocused ? 'rgba(123,97,255,0.4)' : 'var(--border)'}`,
              color: '#e8f0fe',
              width: searchFocused ? 220 : 160,
              fontFamily: 'var(--font-dm-sans)',
              transition: 'all 0.2s',
            }}
          />
          <span className="absolute right-3 text-[10px] font-mono"
            style={{ color: '#3a4a5a' }}>/</span>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Search icon for small screens */}
          <Link href="/search"
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg no-underline transition-all"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border)', color: '#8899aa', fontSize: 16 }}>
            ⌕
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full"
            style={{ color: 'var(--green)', background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-blink" style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
            247 online
          </div>

          {user ? (
            <Link href={`/profile/${user.username}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg no-underline transition-all"
              style={{ border: '1px solid var(--border)' }}>
              <span className="text-lg">{user.avatarEmoji}</span>
              <span className="hidden sm:block text-sm font-medium text-white">{user.displayName}</span>
            </Link>
          ) : (
            <>
              <button onClick={() => setShowAuth('login')}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer"
                style={{ background: 'transparent', color: '#8899aa', border: '1px solid var(--border2)' }}>
                Sign In
              </button>
              <button onClick={() => setShowAuth('register')}
                className="px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer"
                style={{ background: 'linear-gradient(135deg, var(--accent), #00b8d4)', color: '#000', boxShadow: '0 0 20px rgba(0,229,255,0.2)' }}>
                Join Network
              </button>
            </>
          )}
        </div>
      </nav>

      {showAuth && <AuthModal mode={showAuth} onClose={() => setShowAuth(null)} onSwitch={(m) => setShowAuth(m)} />}
    </>
  )
}