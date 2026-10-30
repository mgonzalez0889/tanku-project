import type { Gift, PayResponse, Product } from '@tanku/shared'
import { useState, type FormEvent } from 'react'
import { api } from '../api.ts'
import { errorMessage } from '../errors.ts'
import { formatCop } from '../format.ts'
import { t } from '../i18n/index.ts'
import { ErrorAlert } from './ErrorAlert.tsx'

interface Props {
  gift: Gift
  product: Product
  onPaid: (result: PayResponse) => void
}

/** The simulated checkout: the card number only travels to the API, it is never kept here. */
export function CheckoutForm({ gift, product, onPaid }: Props) {
  const [cardNumber, setCardNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setPaying(true)
    setError(null)
    try {
      onPaid(await api.pay(gift.id, cardNumber))
    } catch (failure) {
      setError(errorMessage(failure))
      setPaying(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <h2>{t('checkout.title')}</h2>
      <p>
        <strong>{t('checkout.amount', { amount: formatCop(product.priceCop) })}</strong>
      </p>

      <label>
        {t('checkout.card')}
        <input
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={cardNumber}
          onChange={(event) => setCardNumber(event.target.value)}
        />
      </label>
      <p className="hint">{t('checkout.help')}</p>

      {error && <ErrorAlert message={error} />}
      <div className="actions">
        <button type="submit" disabled={paying}>
          {t(paying ? 'checkout.paying' : 'checkout.pay')}
        </button>
      </div>
    </form>
  )
}
