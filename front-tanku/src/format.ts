const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Whole Colombian pesos, e.g. "$ 179.900". */
export const formatCop = (pesos: number): string => cop.format(pesos)
