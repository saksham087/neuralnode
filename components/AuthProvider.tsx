'use client'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuth()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(({ data }) => setUser(data ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [setUser, setLoading])

  return <>{children}</>
}
