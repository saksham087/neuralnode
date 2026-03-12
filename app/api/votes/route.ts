import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, err, unauthorized, handleError } from '@/lib/api'
import { pusherServer, CHANNELS, EVENTS } from '@/lib/pusher'

const VoteSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  value: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const { postId, commentId, value } = VoteSchema.parse(await req.json())
    if (!postId && !commentId) return err('postId or commentId required')

    const where = postId
      ? { userId_postId: { userId: session.userId, postId } }
      : { userId_commentId: { userId: session.userId, commentId: commentId! } }

    const existing = await prisma.vote.findUnique({ where } as any)

    if (value === 0) {
      if (existing) {
        await prisma.vote.delete({ where: { id: existing.id } })
        if (postId) {
          await prisma.post.update({
            where: { id: postId },
            data: {
              upvotes: existing.value === 1 ? { decrement: 1 } : undefined,
              downvotes: existing.value === -1 ? { decrement: 1 } : undefined,
              score: { decrement: existing.value },
            },
          })
        }
      }
      if (postId) await broadcastVote(postId)
      return ok({ vote: null })
    }

    if (existing) {
      await prisma.vote.update({ where: { id: existing.id }, data: { value } })
      if (postId) {
        const diff = value - existing.value
        await prisma.post.update({
          where: { id: postId },
          data: {
            upvotes: value === 1 ? { increment: 1 } : existing.value === 1 ? { decrement: 1 } : undefined,
            downvotes: value === -1 ? { increment: 1 } : existing.value === -1 ? { decrement: 1 } : undefined,
            score: { increment: diff },
          },
        })
      }
    } else {
      await prisma.vote.create({
        data: { userId: session.userId, postId: postId ?? null, commentId: commentId ?? null, value },
      })
      if (postId) {
        await prisma.post.update({
          where: { id: postId },
          data: {
            upvotes: value === 1 ? { increment: 1 } : undefined,
            downvotes: value === -1 ? { increment: 1 } : undefined,
            score: { increment: value },
          },
        })
        const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } })
        if (post) await prisma.user.update({ where: { id: post.authorId }, data: { score: { increment: value } } })
      }
    }

    if (postId) await broadcastVote(postId)
    return ok({ vote: value })
  } catch (e) { return handleError(e) }
}

async function broadcastVote(postId: string) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, score: true, upvotes: true, downvotes: true },
    })
    if (post) {
      await pusherServer.trigger(CHANNELS.VOTES, EVENTS.VOTE_UPDATE, post)
    }
  } catch (e) {
    console.warn('Pusher vote broadcast error (non-fatal):', e)
  }
}