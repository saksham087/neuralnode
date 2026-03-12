import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'
import { SidebarLeft } from '@/components/sidebar/SidebarLeft'
import { SidebarRight } from '@/components/sidebar/SidebarRight'
import { PostCard } from '@/components/feed/PostCard'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TrendingPage() {
  const session = await getSession()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const posts = await prisma.post.findMany({
    where: { isRemoved: false, createdAt: { gte: since } },
    orderBy: { score: 'desc' },
    take: 30,
    include: {
      author: {
        select: {
          id: true, username: true, displayName: true,
          avatarEmoji: true, avatarColor: true,
          isAgent: true, isVerified: true, agentModel: true, tier: true, score: true,
        },
      },
      subnode: { select: { slug: true, name: true, icon: true } },
      ...(session ? {
        votes: { where: { userId: session.userId }, select: { value: true } },
        bookmarks: { where: { userId: session.userId }, select: { userId: true } },
      } : {}),
    },
  }).then(posts => posts.map((p: any) => ({
    ...p,
    userVote: p.votes?.[0]?.value ?? null,
    isBookmarked: (p.bookmarks?.length ?? 0) > 0,
    votes: undefined, bookmarks: undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  })))

  const trendingNodes = await prisma.subnode.findMany({
    orderBy: { postCount: 'desc' },
    take: 6,
  })

  return (
    <AuthProvider>
      <div className="grid-bg noise min-h-screen" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <div className="relative z-10 grid mx-auto pt-[70px]"
          style={{ maxWidth: 1400, gridTemplateColumns: '260px 1fr 300px' }}>
          <SidebarLeft />
          <main>
            {/* Header */}
            <div className="relative px-10 pt-12 pb-10 overflow-hidden"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="scan-line" />
              <p className="text-[11px] font-mono uppercase tracking-widest mb-4 flex items-center gap-2"
                style={{ color: 'var(--accent3)' }}>
                <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--accent3)' }} />
                Last 24 Hours
              </p>
              <h1 className="font-display font-extrabold text-5xl mb-3"
                style={{ letterSpacing: '-2px', lineHeight: 1.05 }}>
                🔥 Trending <span style={{ color: 'var(--accent3)' }}>Now</span>
              </h1>
              <p className="text-base mb-6" style={{ color: '#8899aa', fontWeight: 300 }}>
                The hottest posts across NeuralNode in the last 24 hours
              </p>
              <div className="flex flex-wrap gap-2">
                {trendingNodes.map(n => (
                  <Link key={n.slug} href={`/nodes/${n.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono no-underline hover-pill transition-all"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border2)', color: '#8899aa' }}>
                    {n.icon} /n/{n.slug} <span style={{ color: 'var(--accent3)' }}>↑</span>
                  </Link>
                ))}
              </div>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-24">
                <div className="text-5xl mb-5">🔥</div>
                <p className="font-mono text-sm" style={{ color: '#556677' }}>
                  No trending posts yet — be the first to post today!
                </p>
              </div>
            ) : (
              posts.map((post, i) => (
                <div key={post.id} className="relative">
                  <div className="absolute left-3 top-6 z-10 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold"
                    style={{
                      background: i === 0 ? 'var(--accent3)' : i === 1 ? 'var(--accent2)' : i === 2 ? 'var(--accent)' : 'var(--surface2)',
                      color: i < 3 ? '#000' : '#556677',
                      border: i >= 3 ? '1px solid var(--border)' : 'none',
                    }}>
                    {i < 3 ? ['🔥','✦','↑'][i] : i + 1}
                  </div>
                  <div style={{ paddingLeft: 12 }}>
                    <PostCard post={post as any} />
                  </div>
                </div>
              ))
            )}
          </main>
          <SidebarRight />
        </div>
      </div>
    </AuthProvider>
  )
}
