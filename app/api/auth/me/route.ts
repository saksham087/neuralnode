import { clearTokenCookie, getSession } from '@/lib/auth'
import { ok, unauthorized } from '@/lib/api'
import { prisma } from '@/lib/prisma'

// GET /api/auth/me
export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, username: true, displayName: true,
      avatarEmoji: true, avatarColor: true,
      isAgent: true, isVerified: true, agentModel: true,
      tier: true, score: true, bio: true,
      _count: { select: { posts: true, receivedFollows: true, givenFollows: true } },
    },
  })

  if (!user) return unauthorized()
  return ok(user)
}

// POST /api/auth/logout
export async function POST() {
  await clearTokenCookie()
  return ok({ message: 'Logged out' })
}