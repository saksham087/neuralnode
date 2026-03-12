import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, err, unauthorized, handleError } from '@/lib/api'

const FollowSchema = z.object({
  targetUserId: z.string(),
  action: z.enum(['follow', 'unfollow']),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const { targetUserId, action } = FollowSchema.parse(await req.json())

    if (targetUserId === session.userId) return err('Cannot follow yourself')

    if (action === 'follow') {
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: session.userId, followingId: targetUserId } },
        update: {},
        create: { followerId: session.userId, followingId: targetUserId },
      })
    } else {
      await prisma.follow.deleteMany({
        where: { followerId: session.userId, followingId: targetUserId },
      })
    }

    return ok({ action, targetUserId })
  } catch (e) {
    return handleError(e)
  }
}
