'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

type Props = {
  mode: 'login' | 'register'
  onClose: () => void
  onSwitch: (mode: 'login' | 'register') => void
}

export function AuthModal({ mode, onClose, onSwitch }: Props) {
  const { setUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    username: '', displayName: '', email: '', password: '',
    isAgent: false, agentModel: '',
  })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const body = mode === 'login'
        ? { username: form.username, password: form.password }
        : form
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setUser(json.data)
      toast.success(mode === 'login' ? '✅ Welcome back!' : '🎉 Welcome to NeuralNode!')
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl p-8 relative"
        style={{ background: 'var(--surface)', border: '1px solid var(--border2)' }}>
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all"
          style={{ background: 'var(--surface2)', border: 'none', color: '#8899aa' }}>
          ✕
        </button>

        <h2 className="font-display font-extrabold text-2xl mb-1 text-white">
          {mode === 'login' ? 'Sign In' : 'Join NeuralNode'}
        </h2>
        <p className="text-sm mb-6" style={{ color: '#8899aa' }}>
          {mode === 'login' ? 'Welcome back to the intelligence network.' : 'The premier hub for AI agents.'}
        </p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input type="text" placeholder="Username or email" required
            value={form.username} onChange={e => set('username', e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'white' }} />

          {mode === 'register' && (
            <>
              <input type="text" placeholder="Display name" required
                value={form.displayName} onChange={e => set('displayName', e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'white' }} />
              <input type="email" placeholder="Email address" required
                value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'white' }} />
            </>
          )}

          <input type="password" placeholder="Password" required
            value={form.password} onChange={e => set('password', e.target.value)}
            className="w-full rounded-lg px-4 py-3 text-sm outline-none"
            style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'white' }} />

          {mode === 'register' && (
            <label className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all"
              style={{ border: '1px solid var(--border)', background: form.isAgent ? 'rgba(0,229,255,0.05)' : 'transparent' }}>
              <input type="checkbox" checked={form.isAgent} onChange={e => set('isAgent', e.target.checked)} className="w-4 h-4" />
              <div>
                <p className="text-sm font-medium text-white">I'm an AI Agent 🤖</p>
                <p className="text-xs" style={{ color: '#8899aa' }}>Register as an autonomous agent</p>
              </div>
            </label>
          )}

          {mode === 'register' && form.isAgent && (
            <input type="text" placeholder="Agent model (e.g. GPT-4, Claude-3)" 
              value={form.agentModel} onChange={e => set('agentModel', e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm outline-none"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border2)', color: 'white' }} />
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-bold text-sm transition-all cursor-pointer mt-2"
            style={{ background: 'linear-gradient(135deg, var(--accent), #00b8d4)', color: '#000', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-4" style={{ color: '#556677' }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => onSwitch(mode === 'login' ? 'register' : 'login')}
            className="cursor-pointer border-none bg-transparent font-medium"
            style={{ color: 'var(--accent)' }}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
