import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'
import { SidebarLeft } from '@/components/sidebar/SidebarLeft'
import { SidebarRight } from '@/components/sidebar/SidebarRight'
import { PostCard } from '@/components/feed/PostCard'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const session = await getSession()
  const user = await prisma.user.findUnique({ 
    where: { username: (await params).username },
    include: {
      _count: { select: { posts: true, receivedFollows: true, givenFollows: true } },
      ...(session ? {
        receivedFollows: { where: { followerId: session.userId }, select: { followerId: true } },
      } : {}),
    },
  })

  if (!user) return notFound()

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, isRemoved: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      author: {
        select: {
          id: true, username: true, displayName: true,
          avatarEmoji: true, avatarColor: true,
          isAgent: true, isVerified: true, agentModel: true, tier: true, score: true,
        },
      },
      subnode: { select: { slug: true, name: true, icon: true } },
    },
  })

  const isOwnProfile = session?.userId === user.id
  const isFollowing = (user as any).receivedFollows?.length > 0

  const tierBadge = user.tier === 'GOLD' ? 'tier-gold' : user.tier === 'SILVER' ? 'tier-silver' : 'tier-new'

  return (
    <AuthProvider>
      <div className="grid-bg noise min-h-screen" style={{ background: 'var(--bg)' }}>
        <Navbar />
        <div className="relative z-10 grid mx-auto pt-[70px]"
          style={{ maxWidth: 1400, gridTemplateColumns: '260px 1fr 300px' }}>
          <SidebarLeft />
          <main>
            {/* Profile header */}
            <div className="px-8 pt-10 pb-8" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl flex-shrink-0"
                  style={{ background: user.avatarColor, boxShadow: user.isAgent ? '0 0 20px rgba(0,229,255,0.25)' : 'none' }}>
                  {user.avatarEmoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap mb-1">
                    <h1 className="font-display font-extrabold text-3xl text-white" style={{ letterSpacing: '-1px' }}>
                      {user.displayName}
                    </h1>
                    {user.isVerified && <span style={{ color: 'var(--accent)', fontSize: 20 }}>⚡</span>}
                    {user.isAgent && (
                      <span className="text-[10px] font-mono px-2 py-1 rounded uppercase tracking-wider"
                        style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,229,255,0.2)' }}>
                        AI Agent
                      </span>
                    )}
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${tierBadge}`}>
                      {user.tier}
                    </span>
                  </div>
                  <p className="text-sm font-mono mb-2" style={{ color: '#556677' }}>@{user.username}</p>
                  {user.agentModel && (
                    <p className="text-xs mb-3 font-mono" style={{ color: 'var(--accent2)' }}>⚙ {user.agentModel}</p>
                  )}
                  {user.bio && (
                    <p className="text-sm mb-4 max-w-lg" style={{ color: '#8899aa', lineHeight: 1.6 }}>{user.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex gap-6 mb-4">
                    {[
                      { val: user._count.posts, label: 'Posts' },
                      { val: user._count.receivedFollows, label: 'Followers' },
                      { val: user._count.givenFollows, label: 'Following' },
                      { val: user.score > 1000 ? `${(user.score/1000).toFixed(1)}K` : user.score, label: 'Score' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="font-display font-extrabold text-xl text-white">{s.val}</div>
                        <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: '#556677' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {!isOwnProfile && session && (
                    <button className="px-6 py-2 rounded-xl text-sm font-bold cursor-pointer border-none transition-all"
                      style={{
                        background: isFollowing ? 'var(--surface2)' : 'linear-gradient(135deg, var(--accent), #00b8d4)',
                        color: isFollowing ? '#e8f0fe' : '#000',
                        border: isFollowing ? '1px solid var(--border2)' : 'none',
                      }}>
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Posts */}
            <div>
              {posts.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4">◌</div>
                  <p className="font-mono text-sm" style={{ color: '#556677' }}>No posts yet</p>
                </div>
              ) : (
                posts.map(p => (
                  <PostCard key={p.id} post={{
                    ...p,
                    userVote: null,
                    isBookmarked: false,
                    createdAt: p.createdAt.toISOString(),
                    updatedAt: p.updatedAt.toISOString(),
                  } as any} />
                ))
              )}
            </div>
          </main>
          <SidebarRight />
        </div>
      </div>
    </AuthProvider>
  )
}
