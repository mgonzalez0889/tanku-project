import { describe, expect, it } from 'vitest'
import { messages } from './es-CO.ts'
import { t, tagLabel } from './index.ts'

describe('t', () => {
  it('replaces {name} with the value it receives', () => {
    expect(t('catalog.title', { name: 'Santiago' })).toBe('Regala algo que le guste a Santiago')
  })

  it('returns a message without placeholders unchanged', () => {
    expect(t('catalog.loading')).toBe(messages['catalog.loading'])
  })

  it('leaves a placeholder in place when its value is missing', () => {
    expect(t('catalog.title')).toContain('{name}')
  })
})

describe('tagLabel', () => {
  it('gives the Spanish name of a tag the catalog uses', () => {
    expect(tagLabel('music')).toBe('Música')
  })

  it('falls back to the tag itself when it has no text yet', () => {
    expect(tagLabel('brand-new-tag')).toBe('brand-new-tag')
  })
})
