# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primario: el hincha o jugador con el celular en la mano.** Sigue la Liga Lago
Futsal desde el teléfono, muchas veces parado en la cancha o justo después del
pitazo final, con datos móviles. Entra a resolver una pregunta puntual —cómo
quedó, cómo va la tabla, cuándo juega mi equipo— y quiere la respuesta en
segundos, no una sesión de navegación.

Otros dos públicos usan el sistema con sesión y pantallas propias:

- **Líder de equipo** (`TEAM_LEADER`): gestiona sus jugadores, arma la plantilla
  de cada inscripción, mira su fixture, sus estadísticas, su historial y sus
  traspasos.
- **Administrador** (`ADMIN`): opera la liga entera —ediciones, categorías,
  competiciones, inscripciones, sorteos, programación, resultados en vivo,
  sanciones, traspasos, publicidad y auditoría.

## Product Purpose

Ser **la fuente oficial** de la liga: el lugar donde se consulta el resultado, la
tabla y el fixture, en reemplazo de los grupos de WhatsApp y las capturas de
pantalla que circulan. El éxito es que cuando dos personas discuten un dato, la
discusión se cierre abriendo el sitio.

## Positioning

Lo publicado no es una transcripción de otra planilla: **sale del mismo sistema
que arbitra la inscripción**. El jugador es un registro único por documento, la
elegibilidad se resuelve por edad y por habilitación del administrador antes de
que entre a una plantilla, y el marcador que se ve en vivo es el que consolida
las estadísticas de la temporada. Una cuenta de Instagram o un grupo de WhatsApp
pueden publicar el mismo resultado, pero no pueden respaldarlo con el registro
que lo produjo.

## Operating Context

- Consulta pública **desde el teléfono, a la intemperie y con datos móviles**,
  típicamente durante o inmediatamente después de un partido.
- El administrador trabaja desde un panel de escritorio: carga eventos en vivo
  durante el partido (goles, tarjetas, MVP) y el marcador viaja por Socket.io a
  quien esté mirando.
- La temporada se organiza en **ediciones, tres por año**. Cada edición abre y
  cierra su propia ventana de traspasos.
- Los equipos se inscriben por competición y **cada inscripción tiene su plantilla
  propia**: el mismo club puede jugar varias categorías con planteles distintos.

## Capabilities and Constraints

Confirmado en el código:

- **Ediciones** → **categorías** (catálogo administrable) → **competiciones**
  (una categoría instanciada en una edición). Formato `LEAGUE` o
  `GROUPS_KNOCKOUT`; tipo división de liga, copa, menores o especial.
- Las divisiones de una edición se entrelazan en un sistema de liga, que es lo
  que le da sentido al **ascenso y descenso**; la copa puede nutrirse de él.
- **Una división por edición.** Un equipo no puede estar inscrito en dos
  divisiones de liga de la misma edición: el sistema de liga las entrelaza y de
  ahí salen el ascenso y el descenso, que dejan de significar algo si un club
  aparece en dos escalones a la vez. Copa, menores y especiales no cuentan para
  la regla — ahí sí puede jugar en paralelo. La salida es explícita: marcar la
  inscripción actual como "No participa" libera al equipo.
- **Elegibilidad al rostear**: rango de edad (calculado en zona horaria de
  Caracas) y, cuando la competición lo exige, habilitación explícita del
  administrador. Cupos mínimo y máximo de plantilla.
- **Posiciones**: victoria 3, empate 1, derrota 0. Orden: puntos → diferencia de
  gol → goles a favor.
- **Traspasos** solo con la ventana de la edición abierta.
- **Sanciones** (`TeamBlock`) con alcance de club entero o de una sola
  competición; el historial de bloqueos no se borra al levantarlos.
- **Publicidad** propia: once ubicaciones del sitio público, con ventana de
  fechas y encendido/apagado por anuncio.
- **Auditoría** de las acciones del administrador.
- Imágenes (escudos, fotos, banners) en MinIO.
- **No existe módulo de pagos.** Nada en el sistema cobra inscripciones, cuotas
  ni patrocinios.
- **El administrador manda sobre el dato.** Un borrado desde administración se
  ejecuta en cascada aunque haya historial colgando; el sistema advierte qué se
  lleva, pero no lo bloquea.

Decisión abierta:

- **Registro de voz sin confirmar.** Los textos están en español, pero el tuteo
  o voseo del producto nunca se acordó y hoy conviven formas distintas.

## Brand Commitments

- Nombre: **Liga Lago Futsal (LLF)**.
- **Una sola liga.** El sistema no se plantea como producto reutilizable para
  otros torneos: la marca, el escudo y la sede pueden ir fijos en el código y el
  diseño puede comprometerse con esa identidad en lugar de mantenerse neutral.
- Créditos de autoría visibles en el pie: "Developed with Colina and Merchan".

## Evidence on Hand

- Logos e isotipos reales en `apps/frontend/src/assets/` (`escudo.PNG`,
  `logo.PNG`, `logo_azul.PNG`, `logo_alterno.jpeg`).
- Banners de competición cargados por el administrador, con arte propio por
  división. Las piezas cargadas hasta ahora identifican la sede como *Colegio de
  Abogados — Maracaibo*.
- Datos reales de la temporada en curso (edición "Apertura 2026", divisiones
  Primera, Segunda y Tercera).
- **No hay** testimonios, métricas de audiencia, acuerdos de patrocinio
  documentados ni prensa. El trabajo futuro no debe inventarlos.

## Product Principles

1. **La respuesta antes que el recorrido.** El visitante llega con una pregunta
   concreta; cada pantalla pública se juzga por cuántos segundos tarda en
   contestarla desde un teléfono.
2. **Un solo dato verdadero.** El sitio es la autoridad: nada provisional se
   muestra como definitivo, y lo que todavía no está resuelto se dice
   explícitamente en vez de omitirse.
3. **Peso mínimo.** Se consume con datos móviles y a la intemperie; el costo de
   cada imagen y cada animación se paga en la calle, no en la oficina.
4. **Identidad comprometida.** Al ser una sola liga, el producto puede —y debe—
   verse como esta liga y no como una plantilla genérica de torneos.
5. **El administrador no pelea con el sistema.** Ante la duda entre proteger el
   dato y dejar operar a quien administra la liga, gana quien administra, con la
   consecuencia dicha de frente.

## Accessibility & Inclusion

No se estableció un estándar formal. La restricción real y confirmada es el
contexto de uso: teléfono en la mano, luz de cancha y datos móviles, lo que hace
del contraste, el tamaño de texto y el peso de página requisitos de producto y no
preferencias visuales.
