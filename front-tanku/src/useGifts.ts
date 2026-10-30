import type { Gift, ServerToClientEvents } from '@tanku/shared'
import { useCallback, useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { api } from './api.ts'
import { errorMessage } from './errors.ts'
import { upsertGift, type Notice } from './gifts.ts'

/**
 * The gifts of a user, kept alive by the socket: a gift that arrives or is accepted shows up
 * without reloading, with a notice. The list is reloaded on every (re)connection, which also
 * covers a recipient who was offline when it happened. Known limit: an event that lands while
 * a reload is in flight can be overwritten by that reload's older answer.
 */
export function useGifts(userId: string) {
  const [gifts, setGifts] = useState<Gift[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notices, setNotices] = useState<Notice[]>([])
  const lastNoticeId = useRef(0)

  const reload = useCallback(() => {
    api
      .giftsOf(userId)
      .then(setGifts)
      .catch((failure) => setError(errorMessage(failure)))
  }, [userId])

  const upsert = useCallback((gift: Gift) => setGifts((current) => upsertGift(current ?? [], gift)), [])
  const dismiss = useCallback((id: number) => setNotices((current) => current.filter((notice) => notice.id !== id)), [])

  useEffect(() => {
    const socket: Socket<ServerToClientEvents> = io({ auth: { userId } })

    function announce(type: Notice['type'], gift: Gift) {
      upsert(gift)
      setNotices((current) => [...current, { id: ++lastNoticeId.current, type, gift }])
    }

    socket.on('connect', reload)
    socket.on('gift:received', (gift) => announce('received', gift))
    socket.on('gift:accepted', (gift) => announce('accepted', gift))
    return () => {
      socket.disconnect()
    }
  }, [userId, reload, upsert])

  return { gifts, error, notices, dismiss, upsert, reload }
}
