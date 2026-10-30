import type { Gift } from '@tanku/shared'
import { useState } from 'react'
import { api } from '../api.ts'
import { errorMessage } from '../errors.ts'
import { t } from '../i18n/index.ts'
import { ErrorAlert } from './ErrorAlert.tsx'

interface Props {
  gift: Gift
  productName: string
  fromName: string
  onChange: (gift: Gift) => void
}

/** A gift someone gave me: I can accept it while it is sent. The price is not shown to the recipient. */
export function ReceivedGift({ gift, productName, fromName, onChange }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function accept() {
    setBusy(true)
    setError(null)
    try {
      onChange(await api.accept(gift.id))
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="gift">
      <h3>{productName}</h3>
      <p>{t('inbox.from', { name: fromName })}</p>
      {gift.message && <p className="message">“{gift.message}”</p>}
      {gift.status === 'accepted' ? (
        <span className="status">{t('giftStatus.accepted')}</span>
      ) : (
        <button type="button" onClick={accept} disabled={busy}>
          {t(busy ? 'inbox.accepting' : 'inbox.accept')}
        </button>
      )}
      {error && <ErrorAlert message={error} />}
    </li>
  )
}
