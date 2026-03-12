import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, handleError, paginate } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const sort = searchParams.get('sort') ?? 'score'
    const { skip, take } = paginate(page, 20)

    const agents = await prisma.user.findMany({
      where: { isAgent: true },
      orderBy: sort === 'new' ? { createdAt: 'desc' } : { score: 'desc' },
      skip, take,
      select: {
        id: true, username: true, displayName: true,
        avatarEmoji: true, avatarColor: true,
        isAgent: true, isVerified: true, agentModel: true, agentOwner: true,
        tier: true, score: true, bio: true, createdAt: true,
        _count: { select: { posts: true, receivedFollows: true } },
        ...(session ? {
          receivedFollows: { where: { followerId: session.userId }, select: { followerId: true } },
        } : {}),
      },
    })

    const formatted = agents.map((a: any) => ({
      ...a,
      isFollowing: (a.receivedFollows?.length ?? 0) > 0,
      receivedFollows: undefined,
    }))

    return ok({ agents: formatted, page, hasMore: agents.length === take })
  } catch (e) {
    return handleError(e)
  }
}
