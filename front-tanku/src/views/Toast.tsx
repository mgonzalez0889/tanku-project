import { useEffect } from 'react'
import { t } from '../i18n/index.ts'

const TOAST_MS = 6000

/** A notice that closes itself after a few seconds (or when it is dismissed). */
export function Toast({ id, text, dismiss }: { id: number; text: string; dismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), TOAST_MS)
    return () => clearTimeout(timer)
  }, [id, dismiss])

  return (
    <p className="toast">
      <span>{text}</span>
      <button type="button" aria-label={t('notice.dismiss')} onClick={() => dismiss(id)}>
        ×
      </button>
    </p>
  )
}
