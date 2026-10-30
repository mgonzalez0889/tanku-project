import type { Gift, ServerToClientEvents } from '@tanku/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { api } from './api.ts'
import { errorMessage } from './errors.ts'
import { upsertGift, type Notice } from './gifts.ts'

/**
 * The gifts of a user, kept alive by the socket: a gift that arrives or is accepted shows up
 * without reloading, with a notice. The list is reloaded on every (re)connection, which also
 * covers a recipient who was offline when it happened.
 */
export function useGifts(userId: string) {
  const [gifts, setGifts] = useState<Gift[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const [hasNews, setHasNews] = useState(false)
  const lastNoticeId = useRef(0)
  const changes = useRef(0) // how many gifts changed since the start; a reload compares it with its own start

  const reload = useCallback(() => {
    const startedAt = changes.current
    api
      .giftsOf(userId)
      .then((list) => {
        // A gift changed while this was in flight, so this list may be older than it: read again.
        if (changes.current === startedAt) setGifts(list)
        else reload()
      })
      .catch((failure) => setError(errorMessage(failure)))
  }, [userId])

  const upsert = useCallback((gift: Gift) => {
    changes.current += 1
    // Before the first load there is nothing to update: the load that follows already has the gift.
    setGifts((current) => (current ? upsertGift(current, gift) : current))
  }, [])

  const dismiss = useCallback((id: number) => setNotices((current) => current.filter((notice) => notice.id !== id)), [])
  const clearNews = useCallback(() => setHasNews(false), [])

  useEffect(() => {
    const socket: Socket<ServerToClientEvents> = io({ auth: { userId } })

    function announce(type: Notice['type'], gift: Gift) {
      upsert(gift)
      setNotices((current) => [...current, { id: ++lastNoticeId.current, type, gift }])
      setHasNews(true)
    }

    socket.on('connect', reload)
    socket.on('gift:received', (gift) => announce('received', gift))
    socket.on('gift:accepted', (gift) => announce('accepted', gift))
    return () => {
      socket.disconnect()
    }
  }, [userId, reload, upsert])

  return { gifts, error, notices, dismiss, upsert, reload, hasNews, clearNews }
}
