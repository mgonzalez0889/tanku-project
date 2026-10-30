import type { Gift, Product, User } from '@tanku/shared'
import { canPay, productName, splitGifts, userName } from '../gifts.ts'
import { t } from '../i18n/index.ts'
import { ErrorAlert } from './ErrorAlert.tsx'
import { ReceivedGift } from './ReceivedGift.tsx'

interface Props {
  me: User
  users: User[]
  products: Product[]
  gifts: Gift[] | null
  error: string | null
  onChange: (gift: Gift) => void
  onPay: (gift: Gift) => void
}

/** "Mis regalos": what I received (I can answer it) and what I gave (with its status; unpaid ones can be paid). */
export function Inbox({ me, users, products, gifts, error, onChange, onPay }: Props) {
  if (error) return <ErrorAlert message={error} />
  if (gifts === null) return <p>{t('inbox.loading')}</p>

  const { given, received } = splitGifts(gifts, me.id)

  return (
    <section>
      <h2>{t('inbox.received.title')}</h2>
      {received.length === 0 ? (
        <p className="hint">{t('inbox.received.empty')}</p>
      ) : (
        <ul className="gifts">
          {received.map((gift) => (
            <ReceivedGift
              key={gift.id}
              gift={gift}
              product={products.find((product) => product.id === gift.productId)}
              fromName={userName(users, gift.giverId)}
              onChange={onChange}
            />
          ))}
        </ul>
      )}

      <h2>{t('inbox.given.title')}</h2>
      {given.length === 0 ? (
        <p className="hint">{t('inbox.given.empty')}</p>
      ) : (
        <ul className="gifts">
          {given.map((gift) => (
            <li key={gift.id} className="gift">
              <h3>{productName(products, gift.productId)}</h3>
              <p>{t('inbox.to', { name: userName(users, gift.recipientId) })}</p>
              <span className="status">{t(`giftStatus.${gift.status}`)}</span>
              {canPay(gift) && (
                <button type="button" onClick={() => onPay(gift)}>
                  {t('inbox.pay')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
