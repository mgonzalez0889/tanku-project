import { useState } from 'react'

const STORAGE_KEY = 'tanku.userId'

function remembered(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** Who is using the app (there is no login): the id is kept in the browser between visits. */
export function useCurrentUser(): [string | null, (userId: string) => void] {
  const [userId, setUserId] = useState<string | null>(remembered)

  function choose(id: string) {
    setUserId(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // Private mode or blocked storage: the choice just is not remembered.
    }
  }

  return [userId, choose]
}
