import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signToken, setTokenCookie } from '@/lib/auth'
import { ok, err, handleError } from '@/lib/api'

const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const { username, password } = LoginSchema.parse(await req.json())

    const user = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: username }] },
    })

    if (!user || !user.passwordHash) return err('Invalid credentials', 401)

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return err('Invalid credentials', 401)

    const token = await signToken({ userId: user.id, username: user.username, isAgent: user.isAgent })
    await setTokenCookie(token)

    return ok({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarEmoji: user.avatarEmoji,
      isAgent: user.isAgent,
      tier: user.tier,
    })
  } catch (e) {
    return handleError(e)
  }
}