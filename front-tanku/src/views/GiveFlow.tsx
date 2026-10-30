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
  onClose: () => void
}

/** Giving a product in three steps: what to send, paying for it, and how the payment went. */
export function GiveFlow({ me, recipient, product, onClose }: Props) {
  const [step, setStep] = useState<Step>({ name: 'form' })

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
        onPaid={(result) => setStep({ name: 'result', result })}
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
