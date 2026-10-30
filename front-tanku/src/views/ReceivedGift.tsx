import type { Gift, Product } from '@tanku/shared'
import { useState } from 'react'
import { api } from '../api.ts'
import { errorMessage } from '../errors.ts'
import { otherVariants } from '../gifts.ts'
import { t } from '../i18n/index.ts'
import { ErrorAlert } from './ErrorAlert.tsx'

interface Props {
  gift: Gift
  /** Undefined only if the catalog does not know the product: the ids are shown instead of names. */
  product: Product | undefined
  fromName: string
  onChange: (gift: Gift) => void
}

/**
 * A gift someone gave me. While it is sent I can accept it, or switch to another variant and
 * accept in one step ("cambio previo"). The price is not shown to the recipient.
 */
export function ReceivedGift({ gift, product, fromName, onChange }: Props) {
  const options = otherVariants(product, gift)
  const currentLabel = product?.variants.find((variant) => variant.id === gift.variantId)?.label ?? gift.variantId
  const [chosen, setChosen] = useState(options[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function answer(send: () => Promise<Gift>) {
    setBusy(true)
    setError(null)
    try {
      onChange(await send())
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="gift">
      <h3>{product?.name ?? gift.productId}</h3>
      <p>{t('inbox.from', { name: fromName })}</p>
      <p>{t('inbox.variant', { label: currentLabel })}</p>
      {gift.message && <p className="message">“{gift.message}”</p>}
      {gift.status === 'accepted' ? (
        <span className="status">{t('giftStatus.accepted')}</span>
      ) : (
        <>
          <button type="button" onClick={() => answer(() => api.accept(gift.id))} disabled={busy}>
            {t(busy ? 'inbox.accepting' : 'inbox.accept')}
          </button>
          {options.length > 0 && (
            <div className="change">
              <label>
                {t('inbox.changeTo')}
                <select value={chosen} onChange={(event) => setChosen(event.target.value)}>
                  {options.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="secondary"
                onClick={() => answer(() => api.changeVariant(gift.id, chosen))}
                disabled={busy}
              >
                {t('inbox.change')}
              </button>
            </div>
          )}
        </>
      )}
      {error && <ErrorAlert message={error} />}
    </li>
  )
}
