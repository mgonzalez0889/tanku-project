import type { Gift, Product, User } from '@tanku/shared'
import { useState, type FormEvent } from 'react'
import { api } from '../api.ts'
import { errorMessage } from '../errors.ts'
import { AS_THEY_LIKE, buildGiftRequest, MAX_MESSAGE_LENGTH } from '../gifts.ts'
import { t } from '../i18n/index.ts'
import { ErrorAlert } from './ErrorAlert.tsx'

interface Props {
  me: User
  recipient: User
  product: Product
  onCreated: (gift: Gift) => void
  onCancel: () => void
}

export function GiftForm({ me, recipient, product, onCreated, onCancel }: Props) {
  const isFashion = product.category === 'fashion'
  // Fashion starts on "according to their taste" (their size, never shown); the rest on the first option.
  const [variantChoice, setVariantChoice] = useState(isFashion ? AS_THEY_LIKE : product.variants[0]!.id)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const request = buildGiftRequest({
        giverId: me.id,
        recipientId: recipient.id,
        productId: product.id,
        variantChoice,
        message,
      })
      onCreated(await api.createGift(request))
    } catch (failure) {
      setError(errorMessage(failure))
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('gift.title', { product: product.name, name: recipient.name })}</h2>

      <label>
        {t('gift.variant')}
        <select value={variantChoice} onChange={(event) => setVariantChoice(event.target.value)}>
          {isFashion && <option value={AS_THEY_LIKE}>{t('gift.variant.asTheyLike')}</option>}
          {product.variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.label}
            </option>
          ))}
        </select>
      </label>
      {isFashion && <p className="hint">{t('gift.variant.hint', { name: recipient.name })}</p>}

      <label>
        {t('gift.message')}
        <textarea
          value={message}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={3}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>
      <p className="hint">{t('gift.message.count', { count: message.length, max: MAX_MESSAGE_LENGTH })}</p>

      {error && <ErrorAlert message={error} />}
      <div className="actions">
        <button type="submit" disabled={sending}>
          {t(sending ? 'gift.sending' : 'gift.next')}
        </button>
        <button type="button" className="secondary" onClick={onCancel}>
          {t('gift.cancel')}
        </button>
      </div>
    </form>
  )
}
