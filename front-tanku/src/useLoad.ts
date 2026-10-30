import { useEffect, useState } from 'react'
import { errorMessage } from './errors.ts'

/** Runs `load` when `deps` change; gives its result, or the Spanish text of its error. */
export function useLoad<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let current = true // an answer that arrives after `deps` changed is ignored
    load()
      .then((result) => current && setData(result))
      .catch((failure) => current && setError(errorMessage(failure)))
    return () => {
      current = false
    }
  }, deps)

  return { data, error }
}
