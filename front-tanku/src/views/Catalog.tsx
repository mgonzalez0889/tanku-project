import type { User } from '@tanku/shared'
import { api } from '../api.ts'
import { formatCop } from '../format.ts'
import { t } from '../i18n/index.ts'
import { useLoad } from '../useLoad.ts'
import { ErrorAlert } from './ErrorAlert.tsx'

/** The catalog as the recipient's taste orders it; the card itself never reaches this screen. */
export function Catalog({ recipient }: { recipient: User }) {
  const { data: products, error } = useLoad(() => api.productsFor(recipient.id), [recipient.id])

  return (
    <section>
      <h2>{t('catalog.title', { name: recipient.name })}</h2>
      <p className="hint">{t('catalog.hint')}</p>
      {error && <ErrorAlert message={error} />}
      {!error && products === null && <p>{t('catalog.loading')}</p>}
      {products?.length === 0 && <p>{t('catalog.empty')}</p>}
      <ul className="products">
        {products?.map((product) => (
          <li key={product.id} className="product">
            <span className="category">{t(`category.${product.category}`)}</span>
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            <strong>{formatCop(product.priceCop)}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
