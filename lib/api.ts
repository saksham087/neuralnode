import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status })
}

export function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export function unauthorized() {
  return err('Unauthorized — please sign in', 401)
}

export function notFound(resource = 'Resource') {
  return err(`${resource} not found`, 404)
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return err(error.errors[0].message, 422)
  }
  console.error('[API Error]', error)
  return err('Internal server error', 500)
}

// Pagination helper
export function paginate(page = 1, limit = 20) {
  const skip = (page - 1) * limit
  return { skip, take: limit }
}
