import type { PayResponse, User } from '@tanku/shared'
import { canPay } from '../gifts.ts'
import { t } from '../i18n/index.ts'

interface Props {
  recipient: User
  result: PayResponse
  onTryAgain: () => void
  onDone: () => void
}

export function PaymentResult({ recipient, result, onTryAgain, onDone }: Props) {
  const { gift, payment } = result
  const canTryAgain = canPay(gift)

  return (
    <section>
      <h2>{t(`result.${payment.status}.title`)}</h2>
      <p>{t(`result.${payment.status}.body`, { name: recipient.name })}</p>
      <div className="actions">
        {canTryAgain && (
          <button type="button" onClick={onTryAgain}>
            {t(payment.status === 'pending' ? 'result.otherCard' : 'result.retry')}
          </button>
        )}
        <button type="button" className={canTryAgain ? 'secondary' : undefined} onClick={onDone}>
          {t('result.back')}
        </button>
      </div>
    </section>
  )
}
