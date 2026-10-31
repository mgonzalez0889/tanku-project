# Nido · Regalos que conectan

Prueba técnica full stack: una tienda ficticia (Nido) donde **regalar deja de ser adivinar**. Quien recibe cuenta en privado qué le gusta, quien regala ve el catálogo ordenado para esa persona sin ver esa tarjeta, y quien recibe puede **cambiar la talla o la opción antes de aceptar**, con aviso en vivo para ambos.

- **URL pública:** _(se añade al desplegar; ver [Despliegue](#despliegue))_
- **Código:** este repositorio (front y back, en un monorepo)
- **Cómo probarlo en 2 minutos:** [más abajo](#cómo-probarlo)

## Propuesta (una página)

**Problema.** La gente usa la tienda para comprar regalos, pero la experiencia es fría y termina en el pago: quien regala adivina, quien recibe no participa y una parte importante de los regalos acaba devuelta o cambiada. Después de las fechas especiales, ambas personas desaparecen.

**Solución.** Convertir el regalo en una conversación corta entre dos personas:

1. **Quien recibe** guarda una *tarjeta de gustos* privada en la pestaña *Mi tarjeta* (categorías y etiquetas que le gustan o que evita, y su talla).
2. **Quien regala** ve el catálogo **ordenado para esa persona**: los productos que evita desaparecen y los que le gustan suben. Nunca ve la tarjeta ni un puntaje, solo el orden.
3. Paga en un checkout simulado. Si elige la opción *"Según sus gustos"*, la talla se completa con la de la tarjeta sin mostrársela.
4. **Quien recibe ve el regalo aparecer en vivo** (no antes del pago, para mantener la sorpresa) y puede **aceptarlo o cambiar la variante una sola vez** (el "cambio previo"). Quien regala se entera en vivo y ve "cambió Negro → Azul".

**Métrica que busca mover: devoluciones y cambios de regalos.** Un cambio hecho *antes* de la entrega es mucho más barato que una devolución, y la tarjeta de gustos reduce la incertidumbre de "¿le gustará?".

**Cómo se mediría.**

| Qué | Cómo |
|---|---|
| Tasa de devolución | devoluciones de regalos ÷ regalos entregados, comparando dos grupos: regalos con tarjeta de gustos y regalos sin ella (prueba A/B por cohorte) |
| Cambio previo | regalos con variante cambiada antes de aceptar ÷ regalos aceptados (ya queda marcado: el regalo guarda su `originalVariantId`) |
| Participación | porcentaje de personas que completan su tarjeta; regalos que se aceptan dentro de las primeras 24 h |
| Recompra | personas que vuelven a regalar o a recibir en 90 días, por cohorte |

Para medirlo de verdad haría falta persistir un registro de eventos (`gift_created`, `gift_paid`, `gift_accepted`, `gift_variant_changed`, `gift_returned`) en una base de datos.

**Lo que no alcancé a construir y cómo lo haría**

| Pendiente | Cómo lo haría |
|---|---|
| Base de datos y registro de eventos | PostgreSQL con las tablas de usuarios, productos, regalos, pagos y eventos; el almacén actual (`store.ts`) es el único punto que cambiaría |
| Inicio de sesión | Hoy hay dos usuarios precargados y los endpoints confían en quien llama; con sesión, el servidor comprobaría quién actúa |
| Resolver un pago "en verificación" | Una confirmación de la pasarela (webhook) que apruebe o rechace el pago pendiente, y bloquear un segundo cobro mientras haya uno abierto |
| Regalo entre varias personas, y recomendaciones con IA | Un pago repartido sobre el mismo regalo; la afinidad hoy es una regla simple y explicable, y un modelo la sustituiría detrás de la misma función |
| Varios servidores | Un adaptador de Socket.io (Redis) y la base de datos compartida |

## Cómo probarlo

1. Abre la URL en **dos ventanas** (mejor una normal y una privada, o dos navegadores): en una elige **Valentina** y en la otra **Santiago** (selector arriba).
2. Como **Santiago**, abre *Mis regalos* y espera. (Antes puedes pasar por *Mi tarjeta*: cambia lo que te gusta o evitas, guarda, y el catálogo de Valentina cambia.)
3. Como **Valentina**: elige un producto → *Regalar* → continúa al pago.
4. Tarjetas de prueba (no se cobra nada), por los **últimos 4 dígitos**:
   - termina en `0000` (o cualquier otra de 16 dígitos): **aprobada**
   - termina en `0002`: **rechazada** (aparece *Reintentar*)
   - termina en `0001`: **en verificación** (se puede intentar con otra tarjeta, o pagar después desde *Mis regalos*)
5. Al aprobarse el pago, **Santiago ve el aviso y el regalo en vivo**. Puede *Aceptar* o *Cambiar y aceptar* con otra variante; Valentina lo ve al instante.

## Cómo correrlo en local

Requisitos: **Node 24** y npm.

```bash
npm install
npm run dev          # API en :3001 y front en http://localhost:5173 (con proxy a la API)
npm test --workspaces --if-present   # 198 pruebas (API y front)
```

Modo producción, igual que en el despliegue (un solo proceso y una sola URL):

```bash
npm install --include=dev && npm run build
PORT=3070 npm start   # http://localhost:3070 : la API sirve el front, el API y el socket
```

Variables de entorno: solo `PORT` (la pone la plataforma). `STATIC_DIR` es opcional (carpeta del front construido). Ver `.env.example`. **No hay claves ni credenciales en el repositorio.**

## Despliegue

Un solo servicio web en Render, donde la API también sirve el front (`render.yaml` en la raíz):

1. Sube el repositorio a GitHub (público).
2. En Render: **New → Blueprint**, conecta el repositorio y confirma. Render usa `render.yaml`: compila con `npm install --include=dev && npm run build` y arranca con `npm start`; comprueba `/api/health`.
3. Con el **plan gratuito** el servicio se duerme tras 15 minutos sin tráfico y despertarlo tarda cerca de un minuto; los datos son de demostración y vuelven al estado inicial en cada arranque. Conviene abrir la URL unos minutos antes de revisarla.

La instancia debe ser **una sola**: el almacén es en memoria y los avisos en vivo viven en ese proceso.

## Arquitectura y decisiones técnicas

```
tanku/
├─ api-tanku/      Express 5 + Socket.io + TypeScript (Vitest)
├─ front-tanku/    React 19 + Vite + TypeScript (Vitest)
├─ packages/shared/ tipos compartidos (solo tipos, sin código en tiempo de ejecución)
└─ render.yaml     despliegue en un solo servicio
```

| Decisión | Por qué |
|---|---|
| **Monorepo** con npm workspaces | Un clon, un README y tipos compartidos (estados del regalo, eventos, códigos de error) entre API y front |
| **Express + Socket.io**, TypeScript estricto | Lo pedido; un servidor persistente que mantiene los WebSockets. Comprobé en la documentación de Render que los admite sin límite de duración (en Vercel los WebSockets están en beta y las conexiones se cierran al terminar la función) |
| **Almacén en memoria** con datos de prueba | Cero infraestructura para la demo; es una sola interfaz (`Store`), cambiable por una base de datos |
| **Dominio puro y probado primero** | Las reglas (estados del regalo, afinidad, checkout, validaciones) son funciones sin HTTP ni sockets; se escribió la prueba, se vio fallar y luego el código |
| **Front en React plano**, sin router, sin librería de estado, de UI ni de i18n | Poco que explicar: hooks, una unión de vistas y un módulo de textos tipado. Textos solo en `es-CO`, nunca en el código |
| **Errores como códigos** (`{ error: "INVALID_VARIANT" }`) | El front los traduce a es-CO y el compilador avisa si falta un texto |
| **Un solo servicio** en producción | Un origen (sin CORS), un despliegue y el socket en el mismo proceso |

**Máquina de estados del regalo** (en `api-tanku/src/domain/gift.ts`; cualquier otra transición es un error `409`):

| Estado | Qué pasa | Siguiente |
|---|---|---|
| `payment_pending` | creado, esperando el pago | `sent` (pago aprobado) · `payment_failed` (rechazado) · sigue igual (en verificación) |
| `payment_failed` | el último pago fue rechazado | se paga de nuevo (reintento) |
| `sent` | pagado: **ahora lo ve quien recibe** | `accepted` (aceptar, o cambiar la variante: una sola vez) |
| `accepted` | final; guarda `originalVariantId` si hubo cambio | — |

El **pago** (`Payment`) es `pending`, `approved` o `rejected`, y cada intento crea uno nuevo. El importe se toma del catálogo y **el número de tarjeta no se guarda ni se devuelve nunca**.

**API** (JSON; los errores son `{ error: CODIGO }`):

| Método y ruta | Qué hace |
|---|---|
| `GET /api/users` · `GET /api/products[?recipientId=]` | usuarios; catálogo (ordenado para esa persona, con lo que evita oculto y sin puntaje) |
| `GET/PUT /api/users/:id/taste-card` | tarjeta de gustos (validada contra el catálogo) |
| `POST /api/gifts` · `GET /api/users/:id/gifts` | crear un regalo; sus regalos (quien recibe solo ve lo pagado) |
| `POST /api/gifts/:id/pay` | checkout simulado → `{ gift, payment }` |
| `POST /api/gifts/:id/accept` · `…/change-variant` | quien recibe acepta, o cambia a otra variante del producto y acepta |
| Socket.io (`auth.userId`) | `gift:received` (a quien recibe, al aprobarse el pago) · `gift:accepted` (a quien regala, con la variante original si cambió) |

**Cómo está probado.** 198 pruebas automáticas: el dominio, la API por HTTP (incluido el servidor que sirve el front), los avisos con sockets reales y la lógica del front. Además, el flujo completo se verificó en un **navegador real con dos usuarios a la vez** (aviso en vivo en las dos direcciones, cambio de variante, reanudar un pago, editar la tarjeta de gustos y ver su efecto en el catálogo de la otra persona, recarga de rutas y producción en una sola URL).

## Seguridad, privacidad y límites conocidos

- **Sin claves en el repositorio.** Variables de entorno (`PORT`), `.env` ignorado y un `.env.example` sin valores.
- **La tarjeta de gustos es privada**: el catálogo ordenado solo devuelve productos en orden, sin puntaje ni tarjeta. Aun así, quien compare el catálogo completo con el ordenado puede deducir qué productos se ocultaron.
- **Sin inicio de sesión** (lo pide el enunciado): los endpoints de la tarjeta y de las acciones confían en quien llama. Con sesión, el servidor comprobaría que actúa la persona correcta.
- **La talla elegida "según sus gustos" se ve en la respuesta** al crear el regalo (decisión consciente: es solo una talla y quien recibe puede cambiarla). La lista de lo regalado no la muestra.
- **Un pago "en verificación" nunca se resuelve** (no hay pasarela real): se puede intentar con otra tarjeta, y en un sistema real otro cobro dejaría el primero abierto.
- **Datos en memoria**: se pierden al reiniciar y la instancia debe ser única.

## Uso de IA

Usé **Claude Code** (modelos de Anthropic) como asistente de programación, con una configuración propia de buenas prácticas (un plugin con *skills*, subagentes y *hooks*). Lo que sigue cuenta lo que realmente pasó; el historial de git tiene un commit por cada pieza.

**Cómo trabajamos.** Cada pieza siguió el mismo ciclo: plan con criterios verificables (en modo plan) → **la prueba primero, viéndola fallar** → el código mínimo → una revisión de simplificación → el *check* completo → una prueba real en un navegador o con `curl` → commit solo con mi autorización. Un subagente "arquitecto" revisó el diseño de las piezas con conceptos nuevos, y otro redactó el mensaje de cada commit.

**Qué hizo Claude.** Propuso y escribió el código y las pruebas de cada pieza, preparó los guiones de verificación en el navegador y las revisiones de simplificación, y redactó los borradores de este README, de la propuesta y del guion del video. No desplegó ni manejó credenciales: me dio los pasos y yo los ejecuto.

**Qué decidí yo.**
- La **idea** (tarjeta de gustos y cambio previo) entre tres propuestas, y la métrica (devoluciones y cambios).
- La **arquitectura**: monorepo, React + Vite, Express, almacén en memoria y un solo servicio en Render.
- Las reglas de **privacidad y de producto**: los productos que quien recibe evita se ocultan; el catálogo de quien regala devuelve solo el orden, sin puntaje; la talla se preselecciona en moda pero quien regala puede elegir otra; el cambio de variante es una sola vez y termina en aceptar.
- El **checkout simulado**: tarjetas de prueba por los últimos 4 dígitos, y no bloquear un segundo pago mientras hay uno pendiente, guiándonos por lo que pedía el enunciado.
- El **flujo de trabajo**: plan antes de cada pieza, un commit por pieza solo con mi autorización, y una revisión final de todo el código.

**Errores de la IA que la verificación atrapó.** No los corregí a ojo: los encontraron las pruebas, la revisión o el navegador, y se arreglaron antes de seguir.
- Un test que pasaba por casualidad (el 404 en HTML no contenía los dígitos de la tarjeta); se reforzó antes de implementar.
- Un servidor que, sin el build del front, habría arrancado "solo API", habría pasado la comprobación de salud y habría dejado la raíz en 404; ahora se niega a arrancar.
- Un parpadeo con el estado viejo al volver de un pago reanudado, y una carrera entre la recarga de la lista y un evento simultáneo; ambos se corrigieron en el código, no relajando la prueba.
- Dos erratas (un espacio de menos en una definición de tipo y en un texto) introducidas por ediciones automáticas; las revisiones las señalaron.

**Qué sigo teniendo que poder explicar.** Cada módulo es pequeño a propósito (sin librerías de estado, de rutas ni de textos, y sin abstracciones que no hagan falta) para poder explicarlo línea por línea.
