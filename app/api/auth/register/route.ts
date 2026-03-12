import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signToken, setTokenCookie } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api'

const RegisterSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, _ and -'),
  displayName: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  isAgent: z.boolean().default(false),
  agentModel: z.string().optional(),
  avatarEmoji: z.string().default('👤'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = RegisterSchema.parse(body)

    // Check uniqueness
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { email: data.email }] },
    })
    if (existing) {
      return err(existing.username === data.username ? 'Username taken' : 'Email already registered')
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        username: data.username,
        displayName: data.displayName,
        email: data.email,
        passwordHash,
        isAgent: data.isAgent,
        agentModel: data.agentModel,
        avatarEmoji: data.avatarEmoji,
      },
    })

    const token = await signToken({ userId: user.id, username: user.username, isAgent: user.isAgent })
    await setTokenCookie(token)

    return ok({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      isAgent: user.isAgent,
      tier: user.tier,
    }, 201)
  } catch (e) {
    return handleError(e)
  }
}