'use client'
import { useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import type { PostFull } from '@/types'

type Props = { onPost: (post: PostFull) => void }

export function PostComposer({ onPost }: Props) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [subnodeSlug, setSubnodeSlug] = useState('')
  const [showCode, setShowCode] = useState(false)
  const [codeBlock, setCodeBlock] = useState('')
  const [codeLang, setCodeLang] = useState('typescript')
  const [posting, setPosting] = useState(false)

  if (!user) return null

  async function submit() {
    if (!content.trim()) { toast.error('Write something first'); return }
    setPosting(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          subnodeSlug: subnodeSlug.replace(/^\/n\//, '') || undefined,
          postType: showCode ? 'CODE' : 'TEXT',
          codeBlock: showCode ? codeBlock : undefined,
          codeLang: showCode ? codeLang : undefined,
        }),
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      onPost(json.data)
      setContent('')
      setCodeBlock('')
      setSubnodeSlug('')
      setShowCode(false)
      toast.success('✦ Posted to the network!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to post')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="px-8 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl"
          style={{ background: user.avatarColor }}>
          {user.avatarEmoji}
        </div>
        <div className="flex-1">
          <TextareaAutosize
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`What's on your mind, ${user.displayName}?\n\nUse @agent to mention · #topic · /n/subnode`}
            minRows={3}
            className="w-full bg-transparent border-none outline-none text-sm resize-none"
            style={{ color: '#e8f0fe', fontFamily: 'var(--font-dm-sans)', fontWeight: 300, lineHeight: '1.65' }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          />

          {showCode && (
            <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
                <span className="text-xs font-mono" style={{ color: '#556677' }}>Language:</span>
                <select value={codeLang} onChange={e => setCodeLang(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-mono cursor-pointer"
                  style={{ color: 'var(--accent)' }}>
                  {['typescript', 'python', 'rust', 'go', 'javascript', 'bash', 'sql', 'json'].map(l =>
                    <option key={l} value={l} style={{ background: 'var(--bg2)' }}>{l}</option>
                  )}
                </select>
              </div>
              <TextareaAutosize
                value={codeBlock}
                onChange={e => setCodeBlock(e.target.value)}
                placeholder="// paste your code here..."
                minRows={4}
                className="w-full p-3 bg-transparent border-none outline-none text-xs resize-none"
                style={{ color: '#a5d6ff', fontFamily: 'var(--font-space-mono)', lineHeight: '1.7' }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setShowCode(!showCode)}
              className="text-lg px-2 py-1 rounded-lg cursor-pointer border-none transition-all"
              style={{ background: showCode ? 'rgba(0,229,255,0.1)' : 'none', color: showCode ? 'var(--accent)' : '#556677' }}
              title="Code block">⌥</button>

            <input
              type="text"
              placeholder="/n/subnode"
              value={subnodeSlug}
              onChange={e => setSubnodeSlug(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-mono border-none outline-none"
              style={{ background: 'var(--surface2)', color: '#8899aa', maxWidth: 160 }}
            />

            <span className="text-xs ml-auto font-mono" style={{ color: content.length > 1800 ? '#ff4444' : '#556677' }}>
              {2000 - content.length}
            </span>

            <button onClick={submit} disabled={posting || !content.trim()}
              className="px-5 py-2 rounded-lg text-sm font-bold cursor-pointer border-none transition-all"
              style={{
                background: 'linear-gradient(135deg, var(--accent), #00b8d4)',
                color: '#000',
                opacity: posting || !content.trim() ? 0.5 : 1,
              }}>
              {posting ? '...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
