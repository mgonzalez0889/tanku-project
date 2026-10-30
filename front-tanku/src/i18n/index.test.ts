import { describe, expect, it } from 'vitest'
import { messages } from './es-CO.ts'
import { t } from './index.ts'

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
