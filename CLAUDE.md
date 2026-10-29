# tanku

Prueba técnica full stack de TANKU: Nido, un e-commerce ficticio de regalos. Solución elegida: **tarjeta de gustos y regalo con "cambio previo"**. Quien recibe llena una tarjeta privada de gustos; quien regala ve el catálogo ordenado por afinidad y paga en un checkout simulado; quien recibe ve el regalo en tiempo real y puede aceptarlo o pedir otra variante antes del envío. Métrica objetivo: devoluciones y cambios de regalos.

## Stack
- Lenguaje de programación: TypeScript (Node 24, npm 11)
- Framework: React + Vite (front), Express + Socket.io (API), Vitest (tests)
- Tipo: monorepo con npm workspaces: API + web (sin login, dos usuarios precargados)

## Comandos
- Instalar dependencias: `npm install`
- Build: `npm run build --workspaces --if-present`
- Tests: `npm test --workspaces --if-present`
- Ejecutar: `npm run dev` (API y front en paralelo)
- Check (los hooks del kit ejecutan `.claude/hooks/check-fast` al terminar, si existe, y `.claude/hooks/check` antes de cada commit): `.claude/hooks/check`

## Idioma
- Idioma del proyecto: español (documentación y mensajes de commit); identificadores, código y comentarios técnicos en inglés.
- Idiomas de la interfaz (UI locales): `es-CO` (por defecto)

## Arquitectura
Monorepo en la raíz `tanku/`: `api-tanku/` (Express + Socket.io), `front-tanku/` (React + Vite) y `packages/shared/` (tipos de estados y eventos compartidos). Persistencia en memoria con seed al arrancar. Despliegue previsto: un solo servicio en Render, con la API sirviendo el build del front. Detalle de estados, modelo de datos y alternativas: `docs/architecture.md` (cuando exista).

## Documentación
README.md (se completa mientras avanzamos: cómo correrlo, decisiones técnicas, "Uso de IA" y propuesta de una página).

## Integraciones
- GitHub — repo público, el push lo hace el dev con `! git push`.
- Render — despliegue manual por el dev; Claude solo da los pasos exactos.
- Variables de entorno: solo en `.env` (ignorado por git); el contrato va en `.env.example`.

## Estándar de código
Reglas propias del proyecto. Crece con las decisiones del equipo y los comentarios de PR aprobados (skill `pr-comments`).
Una línea por regla, con su origen: específica, verificable y que nombre el reemplazo. Si una regla contradice el bloque del kit, prevalece esta sección.
- El repo es público: ninguna clave ni credencial en archivos versionados; usa variables de entorno y `.env.example`, no valores en código. (Requisito de la prueba)
- El PDF de requisitos es confidencial: no lo copies ni lo cites literal en archivos del repo; resúmelo con tus palabras. (Decisión 2026-10-28)
- El dev debe poder explicar cada línea: tras cada pieza, resume en 5 líneas qué hiciste y señala las 3 líneas clave. (Decisión 2026-10-28)
- El checkout y los estados del regalo y del pago se escriben con test primero (Vitest). (Decisión 2026-10-28)
- Claude no despliega ni maneja credenciales: da los pasos exactos al dev. (Decisión 2026-10-28)

<!-- kit:start v0.25.0 lang=es — gestionado por claude-kit; se reemplaza con /kit:setup-project; las reglas del proyecto van fuera -->
## Flujo de cambio
Todo cambio de código sigue `/kit:change` (el skill `change`), aunque no se invoque: plan en Plan Mode con criterios de éxito verificables; test primero (verlo fallar); código; `/simplify`; revisar el diff y luego `/code-review`; suite completa y proyecto corriendo, con evidencia; commit.
Cambios triviales (typo, texto): código, revisar el diff, probar, commit.

## Límites del agente
- Si la petición no dice qué cambia, dónde, restricciones o cómo se verifica, reformúlala marcando tus supuestos y confírmala antes de planificar.
- Cambio mínimo: sin abstracciones, opciones ni archivos extra.
- **Antes de decir "listo", ejecuta el skill `verify` y muestra su informe; si algo no pudo ejecutarse, di "no verificado".**
- **Nunca omitas, borres ni relajes un test para que pase: arregla el código o explica por qué el test está mal.**
- Lee el diff completo antes de reportar; tu resumen no lo sustituye.
- Commit, push y PR solo con autorización del dev; con el kit instalado, un hook bloquea los push a main/master.
- Si un hook te bloquea, lee su mensaje, no lo intentes de otra forma y díselo al dev.
- Sistemas externos: CLI oficial, luego un skill, un servidor MCP al final (sus herramientas ocupan contexto aunque no se usen). Usa lo que liste Integraciones.
- Busca el código y lee solo las partes relevantes; para exploraciones amplias usa un subagente Explore.

## Idioma e internacionalización
- Código, comentarios, documentación y mensajes de commit en el idioma del proyecto; habla con el dev en el suyo.
- Con idiomas de la interfaz, el texto visible va en archivos de recursos de i18n (idioma por defecto primero), nunca en el código.

## Instrucciones repetidas → skill
Si un prompt repite instrucciones sobre cómo hacer una tarea que el dev ya dio en esta sesión ("como siempre", "recuerda…"): haz la tarea y pregunta si convertirlas en un skill de proyecto, con un borrador de nombre y `description` ("Use it when …"). Créalo solo tras un sí, con `/kit:new-skill`; si dice que no, no vuelvas a preguntar por esas instrucciones.

## Sugerencias al desarrollador
Propón, nunca apliques por tu cuenta, mejoras a la configuración de Claude Code:
- En momentos naturales (tarea terminada, exploración grande, cambio de tema): misma tarea y sesión larga: `/compact <qué conservar>` (plan, criterios de éxito, archivos tocados); tarea nueva: guarda en el Estándar de código lo que deba recordarse y luego `/clear`; si no está claro qué ocupa el contexto: `/context`.
- Servidores MCP sin usar: desactívalos con `/mcp`; prefiere una CLI equivalente.
- Un comando seguro (build, tests, lint, solo lectura) aprobado una y otra vez: añádelo a `permissions.allow` en `.claude/settings.json`, nunca uno destructivo.
- Una verificación repetida a mano: automatízala con un hook o un comando del proyecto.
- Una línea que nunca debe cruzarse: un hook o un permiso, no una regla en este archivo.
- Antes de añadir una regla aquí (corregida dos veces, problema recurrente): específica, verificable, que nombre el reemplazo ("usa X, no Y"), una línea en el Estándar de código, sin énfasis nuevo. Si el archivo sigue creciendo, mueve el detalle a un documento (ruta, sin `@`) o a un skill.
<!-- kit:end -->
