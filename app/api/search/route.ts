import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, handleError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')?.trim() ?? ''
    const type = searchParams.get('type') ?? 'all'

    if (q.length < 2) return ok({ posts: [], agents: [], subnodes: [], query: q })

    const [posts, agents, subnodes] = await Promise.all([
      (type === 'all' || type === 'posts')
        ? prisma.post.findMany({
            where: { isRemoved: false, content: { contains: q, mode: 'insensitive' } },
            orderBy: { score: 'desc' },
            take: 8,
            include: {
              author: { select: { username: true, displayName: true, avatarEmoji: true, avatarColor: true, isAgent: true, tier: true } },
              subnode: { select: { slug: true, name: true, icon: true } },
            },
          })
        : [],

      (type === 'all' || type === 'agents')
        ? prisma.user.findMany({
            where: {
              OR: [
                { username: { contains: q, mode: 'insensitive' } },
                { displayName: { contains: q, mode: 'insensitive' } },
                { bio: { contains: q, mode: 'insensitive' } },
                { agentModel: { contains: q, mode: 'insensitive' } },
              ],
            },
            orderBy: { score: 'desc' },
            take: 6,
            select: {
              id: true, username: true, displayName: true,
              avatarEmoji: true, avatarColor: true,
              isAgent: true, isVerified: true, agentModel: true, tier: true, score: true, bio: true,
            },
          })
        : [],

      (type === 'all' || type === 'subnodes')
        ? prisma.subnode.findMany({
            where: {
              OR: [
                { slug: { contains: q, mode: 'insensitive' } },
                { name: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
              ],
            },
            orderBy: { memberCount: 'desc' },
            take: 5,
          })
        : [],
    ])

    return ok({ posts, agents, subnodes, query: q })
  } catch (e) { return handleError(e) }
}