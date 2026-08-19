---
target: portada pública
total_score: 14
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-19T18-59-41Z
slug: apps-frontend-src-pages-public-publichome-tsx
---
Method: dual-agent (A: a893e504915b8079e · B: a110e0101bdc7866f)

## Design Health Score

| # | Heurística | Puntaje | Hallazgo clave |
|---|-----------|-------|-----------|
| 1 | Visibilidad del estado del sistema | 1 | El marcador en vivo está congelado: `refetchOnWindowFocus: false`, sin `refetchInterval`, y el único listener de socket vive en `LiveScoreboard`, que en la portada solo monta dentro del modal. Ninguna query lee `isLoading`/`isError`. |
| 2 | Correspondencia con el mundo real | 2 | Buen castellano de dominio, pero el feed en vivo imprime los enums crudos `GOAL`/`YELLOW`/`RED` y las fechas salen como `23-08-2026 08:30 PM`. |
| 3 | Control y libertad | 2 | El modal cierra bien, pero nada vive en la URL: no hay enlace que abra la tabla de la Primera. |
| 4 | Consistencia y estándares | 2 | Las otras cinco pantallas públicas abren con `variant="h2"`; la portada no tiene título. El vivo se pinta con `MatchCard` acá y con `LiveScoreboard` en `/en-vivo`. |
| 5 | Prevención de errores | 1 | Un partido programado abre un modal con "0 : 0" a 64px. `matchWhere` no filtra por fecha: partidos vencidos siguen bajo "Próximos partidos". |
| 6 | Reconocer antes que recordar | 2 | Escudos, franja de estado y chips funcionan; el MVP es un ícono sin etiqueta con tooltip que no abre al tacto. |
| 7 | Flexibilidad y eficiencia | 1 | El sistema no recuerda nada del hincha salvo el tema. Sin equipo favorito, sin filtro, sin "ver todos". |
| 8 | Estética y minimalismo | 2 | Componentes sobrios y `AdSlot` no deja huecos; pero cuatro ranuras publicitarias enmarcan tres secciones y el elemento más fuerte de la página es "Iniciar sesión". |
| 9 | Recuperación de errores | 0 | No existe camino de error en toda la portada. API caída, sin conexión y temporada vacía se ven idénticos. |
| 10 | Ayuda y documentación | 1 | La portada de "la fuente oficial" nunca dice qué es ni por qué su dato es el bueno. |
| **Total** | | **14/40** | **Poor — revisión mayor de UX necesaria** |

## Design Specificity Verdict

**Los componentes están autorados para este producto. La página que los contiene, no.**

Sacando los strings, la portada es: contenedor → franja oscura con contador → banner → h3 + grilla → h3 + grilla → banner → h3 + grilla. Cambiando "Próximos partidos" por "Próximos conciertos" la misma página sirve a un circuito de pádel o una sala de conciertos.

`MatchCard` sí es específico: franja de 4px que codifica estado, marcador tabular, ganador en peso 800 y escudo del perdedor al 55% — comunica el resultado antes de que leas el número. `EditionBar` también, y su docstring documenta la decisión de matar el hero.

Prueba forense de genericidad: `index.html` declara `theme-color: #4361EE`, un índigo que no existe en `tokens.ts`. El color con el que el navegador pinta la liga es el de una plantilla. `brandGradient` está definido en ambos sets de tokens y usado cero veces. `escudo.PNG` y `logo_alterno.jpeg` no aparecen en ninguna pantalla pública. El Naranja Bengala no aparece ni una vez en la portada.

**Escaneo determinista:** el detector devolvió **0 hallazgos** sobre los 8 archivos de la superficie (exit 0). En todo `apps/frontend/src` encontró 2, ambos `layout-transition` en `AdminLayout.tsx:35` y `TeamLayout.tsx:35`, fuera de esta superficie. El detector y la revisión no coinciden en nada porque miden cosas distintas: el detector busca slop visual en el marcado y no hay; los problemas de esta portada son de qué dato muestra y si se actualiza.

**Overlays visuales:** omitidos — no hay herramienta de automatización de navegador expuesta en la sesión.

## Overall Impression

La portada de un producto cuyo propósito declarado es "ser la fuente oficial" no muestra ningún resultado y muestra un marcador congelado bajo un punto rojo que late. Ese es el problema, y todo lo demás es secundario.

Lo que funciona son las piezas. Lo que falla es la composición y la plomería de datos. No hace falta rediseñar componentes: hace falta decidir qué contesta esta página y conectarla al dato vivo.

La oportunidad más grande: invertir el orden. Primero "cómo quedó", después "qué está pasando", después "cuándo se juega". Hoy está al revés y falta la mitad.

## What's Working

1. **`MatchCard` es un componente firma real.** La franja de 4px codifica estado sin gastar texto, el marcador usa `tabular-nums`, el ganador sube a peso 800 y el escudo del perdedor baja a `opacity: 0.55`. Eso último comunica el resultado antes de que leas el número — exactamente lo que necesita alguien mirando de reojo con el teléfono en una mano.
2. **`EditionBar` es una corrección deliberada y argumentada.** Reemplazó un hero de 150px por una franja de 56px para que los partidos suban. El comentario "un 0 EN VIVO en rojo miente" muestra que alguien pensó en la integridad semántica del rojo.
3. **`AdSlot` no deja huecos ni miente sobre el inventario.** Devuelve `null` cuando no hay anuncios vigentes, rota en el mismo espacio en vez de apilar y marca los enlaces con `rel="sponsored"`.

## Priority Issues

### [P0] La portada de un producto de resultados no muestra ningún resultado
`PublicHome.tsx:22-23` consulta `LIVE` y `SCHEDULED`. Nada más. No hay consulta de `FINISHED` ni tabla de posiciones.

**Por qué importa:** el usuario primario entra "durante o inmediatamente después de un partido" a preguntar "cómo quedó". La portada no puede contestarlo. Peor: el partido que acaba de terminar **desaparece** de la portada en el segundo en que el administrador lo cierra.

**Fix:** invertir la composición — "Última jornada" (`FINISHED`, los 6 más recientes) primero, en vivo cuando lo haya, próximos partidos reducidos al próximo día de juego, y la tabla de Primera embebida (top 5 + "ver tabla completa").

**Comando sugerido:** `/impeccable shape` (recomposición de la superficie), después `/impeccable polish`.

### [P0] El marcador "en vivo" está congelado y la página no sabe decir "cargando" ni "falló"
Tres defectos que se refuerzan: `queryClient.ts` fija `refetchOnWindowFocus: false` y ninguna query define `refetchInterval`; el único `s.on('match:update')` está en `LiveScoreboard.tsx:42`, que en la portada solo monta dentro del modal y cuyos updates nunca escriben en el caché; y `PublicHome` ignora `isLoading`/`isError` en las cinco queries.

**Por qué importa:** el marcador de la portada es una foto del momento en que cargó la página, bajo un punto rojo que promete lo contrario. Si abrís el modal ves 3:2 y al cerrarlo la tarjeta detrás sigue diciendo 1:0: la misma pantalla muestra dos marcadores distintos del mismo partido. En 3G, durante los primeros segundos, la fuente oficial afirma en gris que no hay partidos programados.

**Fix:** listener global de `match:update` que haga `setQueryData` sobre `['public','matches']`; `refetchInterval: 20000` cuando el estado es `LIVE`, como red si cae el socket; exponer `isLoading`/`isError` con `LoadingState` y un bloque de error con "Reintentar"; sellar el `EditionBar` con la hora del último dato.

**Comando sugerido:** `/impeccable harden`.

### [P1] Las tarjetas no son controles: ni teclado, ni lector de pantalla, ni encabezado de página
`MatchCard.tsx:55` y `CompetitionCard.tsx:32` son `motion.div` con `onClick`, sin `role="button"`, sin `tabIndex`, sin `onKeyDown`: doce objetivos primarios inalcanzables sin mouse. La portada no tiene `h1` ni `h2` — su encabezado más alto son tres `h3`. Los `Avatar` de escudos no reciben `alt`, así que se lee la URL. `AppModal` no pasa `aria-labelledby`. El marcador cambia por socket sin `aria-live`.

Y confirmado: `text.disabled` no está definido ni en `tokens.ts` ni en `theme.ts`, así que rige el default de MUI `rgba(0,0,0,0.38)` — ~2.9:1 sobre blanco, no llega a AA. Ese color carga el "VS" y el separador ":" del marcador, en una pantalla pensada para leerse a la intemperie.

El bloque `prefers-reduced-motion` que agregamos solo neutraliza animaciones CSS: las píldoras "EN VIVO" animan por JS con framer-motion (`repeat: Infinity`) y siguen destellando, igual que la rotación de 8s del `AdSlot`. WCAG 2.2.2 sin control de pausa.

**Fix:** `CardActionArea` o `role/tabIndex/onKeyDown` en las tarjetas; `h1` con el nombre de la edición y bajar las secciones a `h2`; `alt` en escudos y logo; `aria-labelledby` en `AppModal`; `aria-live="polite"` en el marcador; definir `text.disabled` con contraste AA; `useReducedMotion()` de framer-motion en las animaciones JS.

**Comando sugerido:** `/impeccable audit`.

### [P1] Un modal que miente y seis tarjetas con un solo destino
`PublicHome.tsx:114` mete cualquier partido en `LiveScoreboard`, que no ramifica por estado: un partido del sábado se abre con **"0 : 0" a 64px**, desmintiendo el "VS" de la tarjeta de la que venías. Además `matchesService.list` no incluye `events`, así que ese modal llega **siempre con el feed vacío**. Y las seis `CompetitionCard` navegan al mismo `/competiciones`, que arranca en `competitions[0]`: tocás "Tercera División" y aterrizás en Primera.

**Por qué importa:** "nada provisional se muestra como definitivo" es principio de producto. Un 0:0 gigante para un partido que no empezó lo viola literalmente, y lo va a leer alguien que después lo repite en un grupo de WhatsApp. Lo de las competiciones enseña en el primer toque que las opciones del sitio son decorativas.

**Fix:** en `LiveScoreboard`, si el estado es `SCHEDULED`/`POSTPONED`, reemplazar el marcador por fecha y sede en grande; pedir el detalle con eventos al abrir el modal; rutear a `/competiciones/:id` y que `usePublicScope` lea de `useSearchParams`.

**Comando sugerido:** `/impeccable clarify`.

### [P2] La portada baja 500 partidos para pintar 6, y salta cuando llega el banner
`PUBLIC_MATCHES_LIMIT = 500` y la portada dispara esa consulta sin acotación, trayendo hasta 500 partidos con equipos, competición y MVP anidados para renderizar `upcoming.slice(0, 6)`. El `HOME_BANNER` monta con `height: 'auto'`, `loading="lazy"` y sin espacio reservado justo arriba de "En vivo ahora": cuando llega, empuja los marcadores ~70px hacia abajo. `index.html` bloquea el render con 9 archivos de fuente de un tercer origen.

**Por qué importa:** "Peso mínimo" es principio de producto y se paga en la calle. Casey espera las fuentes, recibe ~1 MB de JSON del que usa el 1.2%, y cuando va a tocar un partido el banner le mueve el objetivo debajo del dedo.

**Fix:** aceptar `limit` y filtro `scheduledAt >= now()` en `/public/matches`; `loading="eager"` y `aspect-ratio` reservado en el banner de portada; recortar a 2 pesos por familia o autohospedar las fuentes.

**Comando sugerido:** `/impeccable optimize`.

## Persona Red Flags

**Casey (móvil distraído):** el banner sin espacio reservado le mueve el objetivo debajo del dedo; el `AdSlot` rota solo cada 8s a centímetros del bloque en vivo; vuelve a la pestaña a los cuatro minutos y el marcador es el que dejó; los nombres de equipo se truncan a ~100px en 360px de ancho ("Deportivo La Rot…"); la fecha exige matemática de calendario con una sola mano. La Regla del Pulgar está rota por la ranura publicitaria y por nada más.

**Jordan (primera vez):** la página nunca dice qué es — es la única de las seis pantallas públicas sin título. El nombre "Liga Lago Futsal" está en `display: { xs: 'none' }`, o sea oculto justo en teléfono. El elemento más fuerte de la portada es "Iniciar sesión", una puerta cerrada: no hay registro público. Toca "Segunda División" y cae en Primera. El estado vacío es una frase gris sin salida, teniendo `EmptyState` en el mismo repo.

**Sam (accesibilidad):** doce tarjetas clicables, cero focusables. Esquema de encabezados `h4 → h3 → h3 → h3`, sin `h1` ni `h2` en toda la app. Escudos sin `alt` → se lee la URL. El diálogo se abre sin nombre. El marcador cambia en silencio. Las animaciones JS ignoran `prefers-reduced-motion`. El "VS" está escrito en el contraste más bajo de la tarjeta y no llega a AA.

## Minor Observations

- `PublicHome.tsx:1` importa `Button` y nunca lo usa: fósil de un "Ver todos" que no existe. Ninguna sección ofrece salida a su listado completo.
- `ROUTES.public.history` (`/historico`) está declarado pero no tiene `<Route>` ni entrada en `NAV`: cualquier enlace cae en el catch-all y rebota.
- `index.html` no tiene `meta description` ni Open Graph. El producto se distribuye pegando enlaces en WhatsApp y la vista previa sale en blanco.
- `useGlobalStore` arranca en `mode: 'light'` y nunca consulta `prefers-color-scheme`. El norte creativo se llama "La Cancha de Noche" y el default es blanco a todo brillo.
- Doble sentido del ámbar en la misma fila de `MatchCard`: marca "Por programar" (falta un dato) y marca el MVP (alguien logró algo). `DESIGN.md` reserva el logro para el Naranja Bengala, que no aparece.
- `LiveScoreboard.tsx:38`: los eventos que llegan por socket se construyen con `player: null`, así que un gol en vivo se muestra sin goleador.
- `AdSlot.tsx:69` calcula `list[index % list.length]` antes del guard de `length === 0`. Hoy no explota porque el valor no se usa antes del return, pero es frágil.
- `PublicLive.tsx:12` consulta `LIVE` sin `editionId` mientras la portada sí lo pasa: la píldora "N EN VIVO" y la página `/en-vivo` pueden mostrar números distintos.
- El chip "Programado" se repite idéntico en las seis tarjetas de "Próximos partidos": seis píldoras tautológicas.

## Questions to Consider

1. Si el usuario entra "justo después del pitazo final", ¿por qué la portada no tiene ni un resultado?
2. ¿Qué sería esta portada si supiera cuál es tu equipo? El store ya persiste el tema en localStorage; un solo `favoriteTeamId` convierte tres secciones genéricas en una respuesta personal, sin backend y sin cuenta.
3. Si `/competiciones` no acepta un id en la URL, ¿qué se pega exactamente en el grupo de WhatsApp para cerrar la discusión?
4. El primer viewport lo ocupan una franja de edición, un banner publicitario y un botón de login. ¿Cuál de los tres se vende mejor que un marcador?
5. Si el rojo significa "está pasando ahora", ¿qué significa un rojo que late sobre un número que no cambia hace cuatro minutos?
6. Los cinco días de la semana en que no hay futsal —probablemente el 70-80% de las visitas— ¿qué ve el visitante? ¿Ese estado merece un diseño propio en vez de ser el residuo de otro?
