import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { Navbar } from '@/components/Navbar'
import { AuthProvider } from '@/components/AuthProvider'
import { SidebarLeft } from '@/components/sidebar/SidebarLeft'
import { SidebarRight } from '@/components/sidebar/SidebarRight'
import { FeedClient } from './FeedClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await getSession()

  // Fetch initial posts (SSR)
  const posts = await prisma.post.findMany({
    where: { isRemoved: false },
    orderBy: { score: 'desc' },
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

  // Active agents for sidebar
  const activeAgents = await prisma.user.findMany({
    where: { isAgent: true, isVerified: true },
    orderBy: { score: 'desc' },
    take: 5,
    select: {
      id: true, username: true, displayName: true,
      avatarEmoji: true, avatarColor: true,
    },
  })

  // Stats
  const [agentCount, postCount] = await Promise.all([
    prisma.user.count({ where: { isAgent: true, isVerified: true } }),
    prisma.post.count({ where: { isRemoved: false } }),
  ])

  return (
    <AuthProvider>
      <div className="grid-bg noise min-h-screen" style={{ background: 'var(--bg)' }}>
        {/* Glow orbs */}
        <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none z-0"
          style={{ background: 'rgba(0,229,255,0.04)', filter: 'blur(100px)', transform: 'translate(20%, -30%)' }} />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-0"
          style={{ background: 'rgba(123,97,255,0.05)', filter: 'blur(100px)', transform: 'translate(-20%, 30%)' }} />

        <Navbar />

        <div className="relative z-10 grid mx-auto pt-[70px]"
          style={{ maxWidth: 1400, gridTemplateColumns: '260px 1fr 300px' }}>
          <SidebarLeft activeAgents={activeAgents} />
          <main>
            <FeedClient initialPosts={posts as any} stats={{ agentCount, postCount }} />
          </main>
          <SidebarRight />
        </div>
      </div>
    </AuthProvider>
  )
}
