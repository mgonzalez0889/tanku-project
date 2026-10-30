// Every text the user reads lives here (default and only locale: es-CO). Catalog names and
// descriptions are data that comes from the API, so they are not here.
export const messages = {
  'app.title': 'Nido · Regalos que conectan',
  'user.picker.label': 'Estás usando Nido como',

  'catalog.title': 'Regala algo que le guste a {name}',
  'catalog.hint': 'Ordenamos los productos según sus gustos, que se mantienen privados.',
  'catalog.loading': 'Cargando productos…',
  'catalog.empty': 'No hay productos para mostrar.',

  'category.fashion': 'Moda',
  'category.tech': 'Tecnología',
  'category.home': 'Hogar',
  'category.beauty': 'Belleza',
  'category.experiences': 'Experiencias',

  'error.INVALID_TRANSITION': 'Este regalo ya no admite esa acción.',
  'error.INVALID_VARIANT': 'Esa opción no está disponible para este producto.',
  'error.INVALID_TASTE_CARD': 'La tarjeta de gustos no es válida.',
  'error.INVALID_GIFT': 'No pudimos crear el regalo. Revisa los datos.',
  'error.INVALID_PAYMENT': 'El número de tarjeta no es válido.',
  'error.USER_NOT_FOUND': 'No encontramos a esa persona.',
  'error.GIFT_NOT_FOUND': 'No encontramos ese regalo.',
  'error.INVALID_JSON': 'No pudimos leer la solicitud.',
  'error.INTERNAL_ERROR': 'Algo salió mal de nuestro lado. Intenta de nuevo.',
  'error.UNKNOWN': 'No pudimos conectar con Nido. Intenta de nuevo.',
} as const
