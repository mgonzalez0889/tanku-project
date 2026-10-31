import type { Product, TasteCard, User } from '@tanku/shared'
import { useState, type FormEvent } from 'react'
import { api } from '../api.ts'
import { errorMessage } from '../errors.ts'
import { t, tagLabel } from '../i18n/index.ts'
import {
  buildTasteCardRequest,
  catalogCategories,
  catalogTags,
  fashionSizes,
  setTagPreference,
  tagPreference,
  toggleCategory,
  type TagPreference,
} from '../tasteCard.ts'
import { useLoad } from '../useLoad.ts'
import { ErrorAlert } from './ErrorAlert.tsx'

const PREFERENCES: TagPreference[] = ['neutral', 'liked', 'avoided']

/** "Mi tarjeta": what I like, privately. Whoever gives me a gift sees the catalog ordered by it, never the card. */
export function TasteCardForm({ me, products }: { me: User; products: Product[] }) {
  // `useLoad` keeps its data if `me` changes; that is harmless because Home is keyed by user and remounts.
  const { data: loaded, error: loadError } = useLoad(() => api.tasteCard(me.id), [me.id])
  const [edited, setEdited] = useState<TasteCard | null>(null) // my changes on top of what was loaded
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const card = edited ?? loaded
  if (loadError) return <ErrorAlert message={loadError} />
  if (!card) return <p>{t('card.loading')}</p>

  function change(next: TasteCard) {
    setEdited(next)
    setSaved(false)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!card) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      setEdited(await api.saveTasteCard(me.id, buildTasteCardRequest(card)))
      setSaved(true)
    } catch (failure) {
      setError(errorMessage(failure))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save}>
      <h2>{t('card.title')}</h2>
      <p className="hint">{t('card.hint')}</p>

      <fieldset>
        <legend>{t('card.categories')}</legend>
        {catalogCategories(products).map((category) => (
          <label key={category} className="check">
            <input
              type="checkbox"
              checked={card.favoriteCategories.includes(category)}
              onChange={() => change(toggleCategory(card, category))}
            />
            {t(`category.${category}`)}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t('card.tags')}</legend>
        {catalogTags(products).map((tag) => (
          <label key={tag} className="tag-row">
            {tagLabel(tag)}
            <select
              value={tagPreference(card, tag)}
              // The cast is safe: the only options are the values of PREFERENCES.
              onChange={(event) => change(setTagPreference(card, tag, event.target.value as TagPreference))}
            >
              {PREFERENCES.map((preference) => (
                <option key={preference} value={preference}>
                  {t(`card.tag.${preference}`)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>

      <label>
        {t('card.size')}
        <select value={card.preferredSize ?? ''} onChange={(event) => change({ ...card, preferredSize: event.target.value })}>
          <option value="">{t('card.size.none')}</option>
          {fashionSizes(products).map((size) => (
            <option key={size.id} value={size.id}>
              {size.label}
            </option>
          ))}
        </select>
      </label>

      {error && <ErrorAlert message={error} />}
      {saved && (
        <p role="status" className="saved">
          {t('card.saved')}
        </p>
      )}
      <div className="actions">
        <button type="submit" disabled={saving}>
          {t(saving ? 'card.saving' : 'card.save')}
        </button>
      </div>
    </form>
  )
}
