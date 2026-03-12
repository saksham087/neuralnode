'use client'
import { useState } from 'react'
import Link from 'next/link'
import { format } from 'timeago.js'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import type { PostFull } from '@/types'

type Props = { post: PostFull; onUpdate?: (updated: PostFull) => void }

export function PostCard({ post: initialPost, onUpdate }: Props) {
  const { user } = useAuth()
  const [post, setPost] = useState(initialPost)
  const [voting, setVoting] = useState(false)

  async function vote(value: 1 | -1 | 0) {
    if (!user) { toast.error('Sign in to vote'); return }
    if (voting) return
    setVoting(true)

    const newValue = post.userVote === value ? 0 : value
    const diff = newValue - (post.userVote ?? 0)

    // Optimistic update
    const updated = {
      ...post,
      upvotes: post.upvotes + (newValue === 1 ? 1 : post.userVote === 1 ? -1 : 0),
      downvotes: post.downvotes + (newValue === -1 ? 1 : post.userVote === -1 ? -1 : 0),
      score: post.score + diff,
      userVote: newValue || null,
    }
    setPost(updated as PostFull)
    onUpdate?.(updated as PostFull)

    try {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, value: newValue }),
      })
    } catch {
      setPost(initialPost) // revert
    } finally {
      setVoting(false)
    }
  }

  async function bookmark() {
    if (!user) { toast.error('Sign in to bookmark'); return }
    // TODO: implement bookmark endpoint
    toast.success(post.isBookmarked ? 'Removed bookmark' : '✦ Bookmarked!')
    setPost(p => ({ ...p, isBookmarked: !p.isBookmarked }))
  }

  const tierClass = post.author.tier === 'GOLD' ? 'tier-gold'
    : post.author.tier === 'SILVER' ? 'tier-silver'
    : post.author.tier === 'PLATINUM' ? 'tier-platinum'
    : 'tier-new'

  return (
    <article className="post-card border-b px-8 py-6" style={{ borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Link href={`/profile/${post.author.username}`}
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 no-underline relative"
          style={{
            background: post.author.avatarColor,
            boxShadow: post.author.isAgent ? '0 0 12px rgba(0,229,255,0.2)' : 'none',
          }}>
          {post.author.avatarEmoji}
          {post.author.isAgent && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
              style={{ background: 'var(--bg)', border: '1px solid var(--border2)' }}>⚡</span>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${post.author.username}`}
              className="font-bold text-sm text-white no-underline hover:underline">
              {post.author.displayName}
            </Link>
            {post.author.isVerified && <span style={{ color: 'var(--accent)' }}>⚡</span>}
            {post.author.isAgent && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider"
                style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--accent)', border: '1px solid rgba(0,229,255,0.2)' }}>
                AI Agent
              </span>
            )}
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider ${tierClass}`}>
              {post.author.tier}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#556677' }}>
            <Link href={`/profile/${post.author.username}`} className="no-underline hover:underline" style={{ color: '#556677' }}>
              @{post.author.username}
            </Link>
            <span>·</span>
            <span className="font-mono">{format(post.createdAt)}</span>
            {post.subnode && (
              <>
                <span>·</span>
                <Link href={`/nodes/${post.subnode.slug}`} className="no-underline font-medium"
                  style={{ color: 'var(--accent)' }}>
                  {post.subnode.icon} /n/{post.subnode.slug}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="text-sm mb-4 leading-relaxed" style={{ color: '#8899aa', fontWeight: 300 }}
        dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />

      {/* Code block */}
      {post.codeBlock && (
        <pre className="mb-4 text-xs overflow-x-auto"
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
          <code>{post.codeBlock}</code>
        </pre>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button onClick={() => vote(1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer border-none"
          style={{
            background: 'none',
            color: post.userVote === 1 ? 'var(--accent)' : '#556677',
            fontFamily: 'var(--font-space-mono)',
          }}>
          ↑ {post.upvotes}
        </button>

        <button onClick={() => vote(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer border-none"
          style={{
            background: 'none',
            color: post.userVote === -1 ? 'var(--red)' : '#556677',
            fontFamily: 'var(--font-space-mono)',
          }}>
          ↓ {post.downvotes}
        </button>

        <Link href={`/post/${post.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs no-underline transition-all"
          style={{ color: '#556677', fontFamily: 'var(--font-space-mono)' }}>
          ◎ {post.commentCount}
        </Link>

        <button onClick={bookmark}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer border-none transition-all"
          style={{
            background: 'none',
            color: post.isBookmarked ? '#ffb900' : '#556677',
            fontFamily: 'var(--font-space-mono)',
          }}>
          {post.isBookmarked ? '✦' : '✧'}
        </button>

        <button className="ml-auto flex items-center px-3 py-1.5 rounded-lg text-xs cursor-pointer border-none"
          style={{ background: 'none', color: '#556677' }}>
          ⋯
        </button>
      </div>
    </article>
  )
}

function formatContent(text: string) {
  return text
    .replace(/\n/g, '<br>')
    .replace(/@(\w+)/g, '<a href="/profile/$1" style="color:var(--accent);text-decoration:none">@$1</a>')
    .replace(/#(\w+)/g, '<span style="color:var(--accent2)">#$1</span>')
    .replace(/\/n\/(\w[-\w]*)/g, '<a href="/nodes/$1" style="color:var(--accent);text-decoration:none">/n/$1</a>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e8f0fe;font-weight:700">$1</strong>')
    .replace(/→ (.*)/g, '<span style="color:#e8f0fe">→ $1</span>')
}
