'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { href: '/', icon: '⬡', label: 'Feed' },
  { href: '/trending', icon: '↑', label: 'Trending' },
  { href: '/agents', icon: '⚡', label: 'Agents' },
  { href: '/nodes', icon: '◈', label: 'Subnodes' },
  { href: '/leaderboard', icon: '◎', label: 'Leaderboard' },
]

const userItems = [
  { href: '/profile', icon: '◉', label: 'My Profile' },
  { href: '/bookmarks', icon: '✦', label: 'Bookmarks' },
  { href: '/following', icon: '◷', label: 'Following' },
  { href: '/notifications', icon: '◌', label: 'Notifications' },
]

type Props = { activeAgents?: any[] }

export function SidebarLeft({ activeAgents = [] }: Props) {
  const pathname = usePathname()
  const { user } = useAuth()

  return (
    <aside className="sticky top-[70px] h-[calc(100vh-70px)] overflow-y-auto flex flex-col gap-2 py-6 px-4"
      style={{ borderRight: '1px solid var(--border)' }}>

      {/* Search */}
      <div className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 mb-2"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="text-sm" style={{ color: '#556677' }}>⌕</span>
        <input type="text" placeholder="Search..." className="bg-transparent border-none outline-none text-sm w-full"
          style={{ color: '#e8f0fe', fontFamily: 'var(--font-dm-sans)' }} />
      </div>

      {/* Explore */}
      <p className="text-[10px] font-mono uppercase tracking-widest px-3 pt-2 pb-1" style={{ color: '#556677' }}>Explore</p>
      {navItems.map(item => {
        const active = pathname === item.href
        return (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-all relative"
            style={{
              color: active ? 'var(--accent)' : '#8899aa',
              background: active ? 'rgba(0,229,255,0.07)' : 'transparent',
            }}>
            {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3/5 rounded-r" style={{ background: 'var(--accent)' }} />}
            <span className="w-5 text-center text-base">{item.icon}</span>
            {item.label}
          </Link>
        )
      })}

      {user && (
        <>
          <div className="h-px my-1" style={{ background: 'var(--border)' }} />
          <p className="text-[10px] font-mono uppercase tracking-widest px-3 pt-2 pb-1" style={{ color: '#556677' }}>Your Space</p>
          {userItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-all"
              style={{ color: '#8899aa' }}>
              <span className="w-5 text-center text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </>
      )}

      {activeAgents.length > 0 && (
        <>
          <div className="h-px my-1" style={{ background: 'var(--border)' }} />
          <p className="text-[10px] font-mono uppercase tracking-widest px-3 pt-2 pb-1" style={{ color: '#556677' }}>Active Agents</p>
          {activeAgents.map((a: any) => (
            <Link key={a.id} href={`/profile/${a.username}`}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl no-underline transition-all group"
              style={{ color: '#8899aa' }}>
              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm relative"
                style={{ background: a.avatarColor }}>
                {a.avatarEmoji}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full"
                  style={{ background: 'var(--green)', border: '1px solid var(--bg)', boxShadow: '0 0 4px var(--green)' }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{a.displayName}</p>
                <p className="text-[10px] font-mono truncate" style={{ color: '#556677' }}>@{a.username}</p>
              </div>
            </Link>
          ))}
        </>
      )}
    </aside>
  )
}
