import { describe, expect, it } from 'vitest'
import { formatCop } from './format.ts'

describe('formatCop', () => {
  it('writes whole pesos with the Colombian thousands separator and no decimals', () => {
    const text = formatCop(179900)

    expect(text).toContain('179.900')
    expect(text).toContain('$')
    expect(text).not.toContain(',')
  })
})
