// Shared event bus for real-time updates

type EventCallback = (event: { type: string; data: any }) => void

const subscribers: Map<string, Set<EventCallback>> = new Map()

export function subscribe(channel: string, callback: EventCallback): () => void {
  if (!subscribers.has(channel)) {
    subscribers.set(channel, new Set())
  }
  subscribers.get(channel)!.add(callback)
  
  return () => {
    subscribers.get(channel)?.delete(callback)
  }
}

export function broadcast(channel: string, event: { type: string; data: any }) {
  const channelSubscribers = subscribers.get(channel)
  if (channelSubscribers) {
    channelSubscribers.forEach(cb => cb(event))
  }
}
