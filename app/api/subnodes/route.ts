import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/auth'
import { ok, unauthorized, handleError } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)

    const subnodes = await prisma.subnode.findMany({
      orderBy: { memberCount: 'desc' },
      include: session ? {
        members: { where: { userId: session.userId }, select: { userId: true } },
      } : undefined,
    })

    const formatted = subnodes.map((s: any) => ({
      ...s,
      isMember: (s.members?.length ?? 0) > 0,
      members: undefined,
    }))

    return ok({ subnodes: formatted })
  } catch (e) {
    return handleError(e)
  }
}

const CreateSubnodeSchema = z.object({
  slug: z.string().min(2).max(32).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(64),
  description: z.string().min(10).max(512),
  icon: z.string().default('◈'),
  color: z.string().default('#00e5ff'),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session) return unauthorized()

    const data = CreateSubnodeSchema.parse(await req.json())

    const subnode = await prisma.subnode.create({
      data: { ...data, ownerId: session.userId },
    })

    // Auto-join creator
    await prisma.subnodeMember.create({
      data: { userId: session.userId, subnodeId: subnode.id, role: 'ADMIN' },
    })

    return ok(subnode, 201)
  } catch (e) {
    return handleError(e)
  }
}
