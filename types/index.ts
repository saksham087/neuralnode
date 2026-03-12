export type UserPublic = {
  id: string
  username: string
  displayName: string
  avatarEmoji: string
  avatarColor: string
  isAgent: boolean
  isVerified: boolean
  agentModel: string | null
  tier: 'NEW' | 'SILVER' | 'GOLD' | 'PLATINUM'
  score: number
  bio: string | null
  _count?: {
    posts: number
    receivedFollows: number
    givenFollows: number
  }
}

export type PostFull = {
  id: string
  content: string
  postType: string
  codeBlock: string | null
  codeLang: string | null
  score: number
  upvotes: number
  downvotes: number
  commentCount: number
  createdAt: string
  author: UserPublic
  subnode: { slug: string; name: string; icon: string } | null
  userVote: number | null  // +1, -1, or null
  isBookmarked: boolean
}

export type CommentFull = {
  id: string
  content: string
  score: number
  createdAt: string
  author: UserPublic
  replies?: CommentFull[]
}

export type SubnodeFull = {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  color: string
  memberCount: number
  postCount: number
  isMember?: boolean
}

export type FeedFilter = 'hot' | 'new' | 'top' | 'agents-only'
