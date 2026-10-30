import type { Product, User } from '@tanku/shared'
import { useState } from 'react'
import { noticeText } from '../gifts.ts'
import { t } from '../i18n/index.ts'
import { useGifts } from '../useGifts.ts'
import { Catalog } from './Catalog.tsx'
import { GiveFlow } from './GiveFlow.tsx'
import { Inbox } from './Inbox.tsx'
import { Toast } from './Toast.tsx'

type View = { name: 'catalog' } | { name: 'give'; product: Product } | { name: 'gifts' }

interface Props {
  me: User
  recipient: User
  users: User[]
  products: Product[]
}

/** What a signed-in user sees: the catalog to give, "Mis regalos", and live notices. */
export function Home({ me, recipient, users, products }: Props) {
  const [view, setView] = useState<View>({ name: 'catalog' })
  const { gifts, error, notices, dismiss, upsert, reload } = useGifts(me.id)

  function show(next: View) {
    // The giver gets no event for their own payment, so the list is read again when it is opened.
    if (next.name === 'gifts') reload()
    setView(next)
  }

  const onGifts = view.name === 'gifts'

  return (
    <>
      <nav className="tabs">
        <button
          type="button"
          className={onGifts ? 'secondary' : undefined}
          aria-current={onGifts ? undefined : 'page'}
          onClick={() => show({ name: 'catalog' })}
        >
          {t('tabs.give')}
        </button>
        <button
          type="button"
          className={onGifts ? undefined : 'secondary'}
          aria-current={onGifts ? 'page' : undefined}
          onClick={() => show({ name: 'gifts' })}
        >
          {t('tabs.gifts')}
        </button>
      </nav>

      <div role="status" aria-live="polite" className="toasts">
        {notices.map((notice) => {
          const { key, values } = noticeText(notice, users, products)
          return <Toast key={notice.id} id={notice.id} text={t(key, values)} dismiss={dismiss} />
        })}
      </div>

      {view.name === 'gifts' && (
        <Inbox me={me} users={users} products={products} gifts={gifts} error={error} onChange={upsert} />
      )}
      {view.name === 'give' && (
        <GiveFlow
          key={view.product.id}
          me={me}
          recipient={recipient}
          product={view.product}
          onClose={() => show({ name: 'catalog' })}
        />
      )}
      {view.name === 'catalog' && (
        <Catalog key={recipient.id} recipient={recipient} onChoose={(product) => show({ name: 'give', product })} />
      )}
    </>
  )
}
