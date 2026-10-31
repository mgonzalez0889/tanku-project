import type { Gift, Product, User } from '@tanku/shared'
import { useState } from 'react'
import { noticeText } from '../gifts.ts'
import { t } from '../i18n/index.ts'
import { useGifts } from '../useGifts.ts'
import { Catalog } from './Catalog.tsx'
import { GiveFlow } from './GiveFlow.tsx'
import { Inbox } from './Inbox.tsx'
import { TasteCardForm } from './TasteCardForm.tsx'
import { Toast } from './Toast.tsx'

// `gift` is set when an unpaid gift is being paid from "Mis regalos" instead of created from the catalog.
type View =
  | { name: 'catalog' }
  | { name: 'give'; product: Product; gift?: Gift }
  | { name: 'gifts' }
  | { name: 'card' }

interface Props {
  me: User
  recipient: User
  users: User[]
  products: Product[]
}

/** What a signed-in user sees: the catalog to give, "Mis regalos", "Mi tarjeta", and live notices. */
export function Home({ me, recipient, users, products }: Props) {
  const [view, setView] = useState<View>({ name: 'catalog' })
  const { gifts, error, notices, dismiss, upsert, reload, hasNews, clearNews } = useGifts(me.id)

  function show(next: View) {
    // The giver gets no event for their own payment, so the list is read again when it is opened.
    if (next.name === 'gifts') reload()
    // Entering or leaving "Mis regalos" counts as having seen what arrived so far.
    if (next.name === 'gifts' || view.name === 'gifts') clearNews()
    setView(next)
  }

  function payLater(gift: Gift) {
    const product = products.find((candidate) => candidate.id === gift.productId)
    if (product) show({ name: 'give', product, gift })
  }

  const tabs: { view: View; label: string; active: boolean; badge?: boolean }[] = [
    { view: { name: 'catalog' }, label: t('tabs.give'), active: view.name === 'catalog' || view.name === 'give' },
    { view: { name: 'gifts' }, label: t('tabs.gifts'), active: view.name === 'gifts', badge: hasNews && view.name !== 'gifts' },
    { view: { name: 'card' }, label: t('tabs.card'), active: view.name === 'card' },
  ]

  return (
    <>
      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.view.name}
            type="button"
            className={tab.active ? undefined : 'secondary'}
            aria-current={tab.active ? 'page' : undefined}
            onClick={() => show(tab.view)}
          >
            {tab.label}
            {tab.badge && <span className="badge">{t('tabs.new')}</span>}
          </button>
        ))}
      </nav>

      <div role="status" aria-live="polite" className="toasts">
        {notices.map((notice) => {
          const { key, values } = noticeText(notice, users, products)
          return <Toast key={notice.id} id={notice.id} text={t(key, values)} dismiss={dismiss} />
        })}
      </div>

      {view.name === 'gifts' && (
        <Inbox
          me={me}
          users={users}
          products={products}
          gifts={gifts}
          error={error}
          onChange={upsert}
          onPay={payLater}
        />
      )}
      {view.name === 'card' && <TasteCardForm me={me} products={products} />}
      {view.name === 'give' && (
        <GiveFlow
          key={`${view.product.id}:${view.gift?.id ?? 'new'}`}
          me={me}
          recipient={recipient}
          product={view.product}
          initialGift={view.gift}
          onGiftChanged={upsert}
          onClose={() => show(view.gift ? { name: 'gifts' } : { name: 'catalog' })}
        />
      )}
      {view.name === 'catalog' && (
        <Catalog key={recipient.id} recipient={recipient} onChoose={(product) => show({ name: 'give', product })} />
      )}
    </>
  )
}
