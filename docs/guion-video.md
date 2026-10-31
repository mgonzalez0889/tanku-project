# Guion del video (máximo 3 minutos)

Tiempo total: **2:55**. Son **304 palabras habladas** (unos 2 a 2,3 minutos de lectura), lo que deja margen para las acciones en pantalla. La escena más cargada es la técnica (2:10 – 2:35, unas 156 palabras por minuto): si suena apurada, recórtala primero. Ensáyalo con cronómetro.

## Antes de grabar (5 minutos)

- [ ] Abre la URL pública **2-3 minutos antes**: el plan gratuito duerme el servicio y despertarlo tarda cerca de un minuto. Comprueba `…/api/health` → `{"status":"ok"}`.
- [ ] Datos limpios: si ya probaste, reinicia el servicio (cada arranque vuelve al estado inicial) o graba tras despertarlo.
- [ ] Dos ventanas **una al lado de la otra** (o dos navegadores): izquierda **Valentina**, derecha **Santiago**. Ancho de móvil si quieres mostrar que es responsive.
- [ ] En la derecha (Santiago): abre ya **Mis regalos** y déjala visible: ahí aparece todo en vivo.
- [ ] Tarjetas de prueba a mano: `…0002` (rechaza) y `…0000` (aprueba). Cierra notificaciones y pestañas que distraigan.
- [ ] Una pasada de práctica **sin grabar** de todo el recorrido.

## Guion

| Tiempo | En pantalla | Lo que dices |
|---|---|---|
| **0:00 – 0:20** | La portada de Nido, con la ventana de Valentina | "Regalar es adivinar: quien regala no sabe qué le gusta a la otra persona, quien recibe no participa, y muchos regalos terminan devueltos. Esto es Nido, y la idea es que regalar sea una conversación corta entre dos personas." |
| **0:20 – 0:40** | El catálogo de Valentina, ordenado | "Quien recibe cuenta en privado qué le gusta, en su pestaña Mi tarjeta. Aquí Valentina le regala a Santiago: el catálogo ya viene ordenado para él, los productos que evita no aparecen, y ella nunca ve su tarjeta, solo el orden. La métrica que busco mover son las devoluciones y los cambios." |
| **0:40 – 1:15** | Valentina elige el **Parlante portátil** → *Regalar* → escribe un mensaje → *Continuar al pago* → paga con `…0002` → *El pago fue rechazado* → *Reintentar* → `…0000` → *¡Regalo enviado!* | "Elijo el parlante, escribo un mensaje y pago en un checkout simulado. Con esta tarjeta el pago se rechaza y puedo reintentar; con esta otra se aprueba. En moda puedo elegir 'según sus gustos' y la talla se completa sola, sin mostrármela." |
| **1:15 – 1:50** | Ventana de **Santiago**: aparece el aviso y el regalo **sin recargar**; clic en *Cambiar a Azul* → *Cambiar y aceptar* | "Y en este momento, sin recargar, a Santiago le llega el aviso y el regalo, por WebSockets. Antes del pago no veía nada, para mantener la sorpresa. A él el negro no le convence, así que cambia a azul **antes** de aceptar: un cambio hecho antes de la entrega es mucho más barato que una devolución." |
| **1:50 – 2:10** | Vuelve a la ventana de Valentina: el aviso *"Santiago aceptó tu regalo y cambió Negro → Azul"* | "Y Valentina se entera al instante: aceptó y cambió negro por azul." |
| **2:10 – 2:35** | Un plano del repositorio o del README (la tabla de estados) | "Por dentro es un monorepo con Express, Socket.io y React en TypeScript. Las reglas, como los estados del regalo y el checkout, son funciones puras que se escribieron con la prueba primero, con ayuda de la IA: hay 198 pruebas, y además se verificó el flujo completo con dos navegadores reales. Va todo en un solo servicio desplegado en Render, sin claves en el repositorio." |
| **2:35 – 2:55** | La sección *Propuesta* y *Uso de IA* del README | "Lo que no alcancé: una base de datos y el registro de eventos para medir la métrica; en el README explico cómo lo haría. Usé Claude Code, y cuento qué hizo la herramienta y qué decidí yo. Gracias." |

## Si te falta tiempo (recorta en este orden)

1. El plano del repositorio (2:10 – 2:35): dilo en una frase mientras muestras la pantalla.
2. El reintento del pago rechazado (solo muestra el pago aprobado).
3. Nunca recortes el aviso en vivo ni el cambio de variante: son el corazón de la idea.

## Si algo falla mientras grabas

- La URL tarda: espera el minuto de arranque y vuelve a empezar la toma.
- Un aviso no aparece: recarga la ventana de Santiago; la lista se vuelve a leer al conectar y verás el regalo.
- Quedó un regalo a medias: *Mis regalos* → *Pagar* lo reanuda sin crear otro.
