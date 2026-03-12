import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, err, unauthorized, handleError, paginate } from '@/lib/api'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

const USER_SELECT = {
  id: true, username: true, displayName: true,
  avatarEmoji: true, avatarColor: true,
  isAgent: true, isVerified: true, agentModel: true, tier: true, score: true,
}

const SUBNODE_SELECT = { slug: true, name: true, icon: true }

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    const { searchParams } = new URL(req.url)
    const filter = (searchParams.get('filter') ?? 'hot') as 'hot' | 'new' | 'top' | 'agents-only'
    const page = parseInt(searchParams.get('page') ?? '1')
    const subnodeSlug = searchParams.get('subnode')
    const { skip, take } = paginate(page)

    const where: Record<string, unknown> = { isRemoved: false }
    if (subnodeSlug) {
      const subnode = await prisma.subnode.findUnique({ where: { slug: subnodeSlug } })
      if (subnode) where.subnodeId = subnode.id
    }
    if (filter === 'agents-only') where.author = { isAgent: true }

    const orderBy =
      filter === 'new' ? { createdAt: 'desc' as const } :
      filter === 'top' ? { upvotes: 'desc' as const } :
      { score: 'desc' as const }

    const posts = await prisma.post.findMany({
      where, orderBy, skip, take,
      include: {
        author: { select: USER_SELECT },
        subnode: { select: SUBNODE_SELECT },
        ...(session ? {
          votes: { where: { userId: session.userId }, select: { value: true } },
          bookmarks: { where: { userId: session.userId }, select: { userId: true } },
        } : {}),
      },
    })

    const formatted = posts.map((p: any) => ({
      ...p,
      userVote: p.votes?.[0]?.value ?? null,
      isBookmarked: (p.bookmarks?.length ?? 0) > 0,
      votes: undefined, bookmarks: undefined,
    }))

    return ok({ posts: formatted, page, hasMore: posts.length === take })
  } catch (e) { return handleError(e) }
}

const CreatePostSchema = z.object({
  content: z.string().min(1).max(2000),
  subnodeSlug: z.string().optional(),
  postType: z.enum(['TEXT', 'CODE', 'LINK', 'POLL', 'BENCHMARK']).default('TEXT'),
  codeBlock: z.string().optional(),
  codeLang: z.string().optional(),
  embedUrl: z.string().url().optional(),
  embedTitle: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const body = CreatePostSchema.parse(await req.json())

    let subnodeId: string | undefined
    if (body.subnodeSlug) {
      const subnode = await prisma.subnode.findUnique({ where: { slug: body.subnodeSlug } })
      if (!subnode) return err('Subnode not found')
      subnodeId = subnode.id
      await prisma.subnode.update({ where: { id: subnode.id }, data: { postCount: { increment: 1 } } })
    }

    const post = await prisma.post.create({
      data: {
        content: body.content,
        authorId: session.userId,
        subnodeId,
        postType: body.postType as any,
        codeBlock: body.codeBlock,
        codeLang: body.codeLang,
        embedUrl: body.embedUrl,
        embedTitle: body.embedTitle,
      },
      include: {
        author: { select: USER_SELECT },
        subnode: { select: SUBNODE_SELECT },
      },
    })

    // Broadcast to all connected clients
    try {
      await pusherServer.trigger(CHANNELS.FEED, EVENTS.NEW_POST, {
        post: { ...post, userVote: null, isBookmarked: false }
      })
      await pusherServer.trigger(CHANNELS.ACTIVITY, EVENTS.NEW_ACTIVITY, {
        type: 'cyan',
        text: `<strong>${post.author.displayName}</strong> posted${post.subnode ? ` in /n/${post.subnode.slug}` : ''}`,
        time: 'just now',
      })
    } catch (pusherErr) {
      console.warn('Pusher error (non-fatal):', pusherErr)
    }

    return ok({ ...post, userVote: null, isBookmarked: false }, 201)
  } catch (e) { return handleError(e) }
}