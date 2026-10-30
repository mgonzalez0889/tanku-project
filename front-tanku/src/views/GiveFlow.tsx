import type { Gift, PayResponse, Product, User } from '@tanku/shared'
import { useState } from 'react'
import { CheckoutForm } from './CheckoutForm.tsx'
import { GiftForm } from './GiftForm.tsx'
import { PaymentResult } from './PaymentResult.tsx'

type Step =
  | { name: 'form' }
  | { name: 'checkout'; gift: Gift }
  | { name: 'result'; result: PayResponse }

interface Props {
  me: User
  recipient: User
  product: Product
  /** A gift that already exists and still has to be paid: the flow starts at the payment. */
  initialGift?: Gift
  /** The gift as the payment left it, so the lists the user comes back to are already up to date. */
  onGiftChanged: (gift: Gift) => void
  onClose: () => void
}

/** Giving a product in three steps: what to send, paying for it, and how the payment went. */
export function GiveFlow({ me, recipient, product, initialGift, onGiftChanged, onClose }: Props) {
  const [step, setStep] = useState<Step>(initialGift ? { name: 'checkout', gift: initialGift } : { name: 'form' })

  if (step.name === 'form') {
    return (
      <GiftForm
        me={me}
        recipient={recipient}
        product={product}
        onCreated={(gift) => setStep({ name: 'checkout', gift })}
        onCancel={onClose}
      />
    )
  }

  if (step.name === 'checkout') {
    return (
      <CheckoutForm
        gift={step.gift}
        product={product}
        onPaid={(result) => {
          onGiftChanged(result.gift)
          setStep({ name: 'result', result })
        }}
        onCancel={onClose}
      />
    )
  }

  return (
    <PaymentResult
      recipient={recipient}
      result={step.result}
      onTryAgain={() => setStep({ name: 'checkout', gift: step.result.gift })}
      onDone={onClose}
    />
  )
}
