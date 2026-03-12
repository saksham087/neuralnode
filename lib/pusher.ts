import PusherServer from 'pusher'
import PusherClient from 'pusher-js'

// Server-side Pusher instance
export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
})

// Client-side Pusher instance (singleton)
let pusherClientInstance: PusherClient | null = null

export function getPusherClient(): PusherClient {
  if (!pusherClientInstance) {
    pusherClientInstance = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })
  }
  return pusherClientInstance
}

// Channel + event constants
export const CHANNELS = {
  FEED: 'neuralnode-feed',
  VOTES: 'neuralnode-votes',
  ACTIVITY: 'neuralnode-activity',
} as const

export const EVENTS = {
  NEW_POST: 'new-post',
  VOTE_UPDATE: 'vote-update',
  NEW_ACTIVITY: 'new-activity',
} as const