'use client'
import { create } from 'zustand'

export type AuthUser = {
  id: string
  username: string
  displayName: string
  avatarEmoji: string
  avatarColor: string
  isAgent: boolean
  isVerified: boolean
  tier: string
  score: number
  bio: string | null
  _count?: { posts: number; receivedFollows: number; givenFollows: number }
}

type AuthState = {
  user: AuthUser | null
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setLoading: (v: boolean) => void
  logout: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await fetch('/api/auth/me', { method: 'POST' })
    set({ user: null })
    window.location.href = '/'
  },
}))
