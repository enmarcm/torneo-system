---
name: Liga Lago Futsal
description: Sistema visual de la LLF — la cancha de noche, leída desde el teléfono.
colors:
  azul-nocturno: "#034292"
  azul-nocturno-hover: "#023575"
  azul-nocturno-suave: "#E0E8F4"
  naranja-bengala: "#FF8A4C"
  naranja-bengala-suave: "#FFEDE1"
  rojo-directo: "#FF3B53"
  navy-profundo: "#1B2237"
  tinta: "#1A2138"
  tinta-suave: "#6B7494"
  papel: "#F4F6FB"
  superficie: "#FFFFFF"
  superficie-elevada: "#F8FAFD"
  borde: "#E6E9F2"
  verde-cerrado: "#22C55E"
  ambar-atencion: "#F59E0B"
  rojo-error: "#EF4444"
  azul-info: "#3B82F6"
  noche-lienzo: "#070B16"
  noche-superficie: "#101828"
  noche-hundida: "#0B1220"
  noche-barra: "#0A0F1E"
  azul-nocturno-claro: "#4D93FF"
  rojo-directo-noche: "#FF4D63"
  tinta-del-vivo: "#2B0710"
  tinta-del-vivo-noche: "#160309"
typography:
  display:
    fontFamily: '"Plus Jakarta Sans", sans-serif'
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  headline:
    fontFamily: '"Plus Jakarta Sans", sans-serif'
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
  title:
    fontFamily: '"Plus Jakarta Sans", sans-serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
  action:
    fontFamily: '"Plus Jakarta Sans", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "normal"
rounded:
  sm: "8px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.azul-nocturno}"
    textColor: "{colors.superficie}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
    padding: "9px 18px"
  button-primary-hover:
    backgroundColor: "{colors.azul-nocturno-hover}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-suave}"
    typography: "{typography.action}"
    rounded: "{rounded.md}"
    padding: "9px 18px"
  card:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lg}"
    padding: "16px"
  panel-hero:
    backgroundColor: "{colors.navy-profundo}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.lg}"
    padding: "20px 28px"
  input:
    backgroundColor: "{colors.superficie-elevada}"
    textColor: "{colors.tinta}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "24px"
    padding: "0 10px"
  chip-live:
    backgroundColor: "{colors.rojo-directo}"
    textColor: "{colors.superficie}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    height: "24px"
    padding: "0 10px"
  table-head:
    backgroundColor: "{colors.superficie-elevada}"
    textColor: "{colors.tinta-suave}"
    typography: "{typography.label}"
    padding: "12px 16px"
---

# Design System: Liga Lago Futsal

## Overview

**Creative North Star: "La Cancha de Noche"**

Futsal bajo luz artificial. El fondo es el azul profundo del gimnasio a las nueve
de la noche; las superficies son las zonas iluminadas donde efectivamente pasa
algo, limpias y recortadas contra ese fondo; y el rojo del vivo es una bengala:
aparece poco, y cuando aparece no se puede ignorar. Nada en el sistema es
neutral por comodidad — el azul es institucional porque la liga lo es, y el
contraste existe porque la pantalla se lee parada en una cancha, no sentado en
una oficina.

El registro es **deportivo y enérgico**: la liga está en marcha y se tiene que
notar desde el primer scroll. Pero la energía se administra, no se derrama. El
color fuerte se gana su lugar: el naranja aparece cuando alguien logró algo y el
rojo cuando algo está sucediendo ahora mismo. Todo lo demás —tablas, plantillas,
fichas, formularios— se mantiene ordenado y legible, porque el visitante llegó
con una pregunta y el sistema se juzga por cuántos segundos tarda en contestarla.

La densidad es media-alta y honesta: hay mucho dato real que mostrar (posiciones,
goleadores, fixtures, plantillas) y el sistema no lo esconde detrás de tarjetas
decorativas. Cada superficie que existe contiene información que alguien fue a
buscar.

**Key Characteristics:**

- Azul institucional profundo como voz principal, en claro y en oscuro.
- Un solo rojo, reservado exclusivamente a lo que está pasando en vivo.
- Dos alfabetos con trabajos distintos: Plus Jakarta Sans manda en títulos y
  números, Inter en todo lo que se lee de corrido.
- Superficies definidas por su borde antes que por su sombra.
- Píldoras para estados, esquinas de 12px para contenedores.
- Movimiento corto y de una sola dirección: las cosas suben apenas al tocarlas.

## Colors

Paleta de azul dominante con dos rojos de trabajos opuestos y un naranja que casi
no se usa a propósito.

### Primary

- **Azul Nocturno** (`#034292`): la voz institucional. Botones primarios, enlaces
  activos, iconografía de acento, pastilla de navegación activa y todo lo que
  representa a la liga como entidad. En modo oscuro se aclara a `#4D93FF` para
  sobrevivir sobre el fondo `#070B16`, y el rótulo del botón primario pasa a
  tinta `#08122A`: el blanco sobre ese azul da 3.0:1, por debajo de AA.
- **Azul Nocturno Suave** (`#E0E8F4`): fondo de estado activo — chips
  seleccionados, item activo de la barra lateral, contenedor de icono en las
  tarjetas de métrica.

### Secondary

- **Naranja Bengala** (`#FF8A4C`): el único color cálido del sistema. Hoy vive en
  tres lugares (tercer puesto del podio de goleadores, una tarjeta de métrica, el
  marcador del historial de equipo) y esa escasez es deliberada, no un descuido.

### Tertiary

- **Rojo Directo** (`#FF3B53`): significa **"está pasando ahora"** y nada más.
  Punto latiente de en vivo, franja izquierda de un partido en curso, contador de
  partidos en directo. No es un color de error ni de acción destructiva.

### Neutral

- **Tinta** (`#1A2138`): texto principal y logotipo.
- **Tinta Suave** (`#6B7494`): texto secundario, cabeceras de tabla, leyendas y
  navegación en reposo.
- **Papel** (`#F4F6FB`): fondo de la aplicación. Nunca es blanco: las superficies
  se recortan contra él.
- **Superficie** (`#FFFFFF`) y **Superficie Elevada** (`#F8FAFD`): tarjetas y
  paneles; la segunda para campos de formulario y cabeceras de tabla, que se
  hunden en lugar de sobresalir.
- **Borde** (`#E6E9F2`): el 1px que define cada superficie. Es el elemento
  estructural más importante del sistema.
- **Navy Profundo** (`#1B2237`): base de los degradados de los paneles héroe y de
  la superficie oscura en modo oscuro.

### Semánticos

- **Verde Cerrado** (`#22C55E`): finalizado, aprobado, activo.
- **Ámbar Atención** (`#F59E0B`): pospuesto, pendiente, sin fecha.
- **Rojo Error** (`#EF4444`): error y acción destructiva. **Distinto del Rojo
  Directo a propósito.**
- **Azul Info** (`#3B82F6`): informativo y programado.

### Named Rules

**La Regla de la Bengala.** El Naranja Bengala nunca supera el 10% de una
pantalla y no aparece más de una vez por vista. Vale porque es raro; si empieza a
aparecer en cada sección, deja de significar algo y hay que sacarlo, no
multiplicarlo.

**La Regla del Rojo Reservado.** `#FF3B53` es exclusivo del estado en vivo. Un
error, un botón de borrar o una alerta usan `#EF4444`. Si los dos rojos aparecen
en la misma pantalla con el mismo significado, el sistema está roto: el visitante
tiene que poder confiar en que el rojo brillante siempre quiere decir *ahora*.

**La Regla del Fondo Gris.** El fondo de la aplicación nunca es `#FFFFFF`. Las
tarjetas son blancas y el lienzo es `#F4F6FB`; esa diferencia de un punto de
luminosidad es lo que hace que las superficies existan sin necesidad de sombra.

**La Regla de la Tinta del Vivo.** El relleno rojo del vivo nunca lleva texto
blanco: da 3.5:1 en claro y 3.2:1 en oscuro, y el rótulo "EN VIVO" es de 11px.
Encima del rojo va tinta (`#2B0710` en claro, `#160309` en oscuro), que sube a
5.3:1 y 6.2:1 y deja la bengala a saturación completa. Bajar el rojo para que
entre el blanco es la solución equivocada: apaga justo lo que tiene que gritar.

### Modo oscuro

El oscuro no es el claro con los valores invertidos: es el norte creativo dicho
literal. El lienzo (`#070B16`) es la tribuna apagada —un negro con azul adentro,
nunca un gris— y cada superficie (`#101828`) es una zona bajo los reflectores,
recortada por un filo de `1px` de blanco al 10%. La barra lateral y la superior
bajan aún más (`#0A0F1E`) para que el contenido quede siendo lo iluminado.

El contraste no es preferencia estética sino requisito de producto: se lee
parado en la cancha con reflectores pegando en la pantalla. El texto va a 16:1
sobre la tarjeta y el secundario (`#98A3BE`) a 7:1.

**La superficie hundida sigue hundida.** `surface2` es más oscuro que la tarjeta
(`#0B1220` bajo `#101828`), igual que `#F8FAFD` bajo `#FFFFFF` en claro: el campo
de formulario y la cabecera de tabla se hunden, no flotan. Aclararlos invierte la
lectura de profundidad del sistema entero.

**Las sombras cambian de trabajo.** En claro despegan del papel y son casi
invisibles; en oscuro tienen que ser negro real (`0 10px 28px rgba(0,0,0,0.55)`),
porque una sombra teñida de navy sobre un fondo casi negro no existe.

## Typography

**Display Font:** Plus Jakarta Sans (fallback `sans-serif`), pesos 400–800.
**Body Font:** Inter (fallback `system-ui, sans-serif`), pesos 400–700.

**Character:** Jakarta es geométrica y ancha de hombros: funciona como cartel, se
lee a distancia y sostiene números grandes sin verse frágil. Inter es la letra de
trabajo, neutra y estrecha, hecha para tablas densas y textos de formulario. La
tensión entre las dos es el sistema: lo que grita está en Jakarta, lo que se
consulta está en Inter.

### Hierarchy

- **Display** (Jakarta 700, `1.875rem`): título de pantalla pública. Uno por
  vista.
- **Headline** (Jakarta 700, `1.5rem`): título de sección y nombre de entidad
  (equipo, jugador, competición).
- **Title** (Jakarta 600, `1.25rem`): encabezado de bloque dentro de una pantalla.
- **Body** (Inter 400, `0.9375rem`): texto corrido, celdas de tabla, campos.
- **Label** (Inter 600, `0.75rem`): chips, leyendas, cabeceras de tabla y
  rótulos en mayúsculas con `letter-spacing: 1px`.
- **Action** (Jakarta 600, `0.875rem`, sin mayúsculas forzadas): botones.

### Named Rules

**La Regla de los Dos Alfabetos.** Jakarta para títulos, botones y números que
importan; Inter para todo lo que se lee de corrido. Un párrafo en Jakarta o una
tabla de posiciones en Inter son errores, no variantes.

**La Regla del Número Tabular.** Todo número que se compara entre filas —
marcadores, puntos, goles, posiciones — usa `font-variant-numeric: tabular-nums`.
Un marcador que baila de ancho mientras cambia es un marcador que no se puede
leer de reojo.

## Layout

Contenedor `xl` de MUI centrado, con respiración de `32px` en móvil y `48px` en
escritorio. La retícula es la de MUI (12 columnas) y el ritmo vertical se apoya en
la escala de 8px: `8 / 16 / 24 / 32 / 48`.

Los patrones de columnas que se repiten:

- Listados de partidos: 1 columna en móvil, 2 en tablet, 3 en escritorio.
- Competiciones: 1 columna en móvil, 2 en escritorio — piezas grandes con imagen.
- Métricas: 2 columnas en móvil, 4 en escritorio.
- Tabla de posiciones y grupos: barra lateral de grupos a un tercio, tabla a dos
  tercios, apiladas en móvil.

La navegación pública se reparte en dos piezas: una barra superior fija de `72px`
(`60px` en teléfono) que cruza la pantalla entera, y debajo una columna lateral
plegable de `244px` (o `76px` en riel de iconos). Los paneles con sesión usan
barra lateral colapsable de `264px` (o `64px` plegada) con la pastilla activa en
Azul Nocturno Suave.

### Named Rules

**La Regla del Pulgar.** La respuesta que el visitante vino a buscar —el
resultado, la posición, el próximo partido— entra en el primer viewport de un
teléfono. Todo lo que empuja esa respuesta hacia abajo es candidato a irse: los
encabezados decorativos, los subtítulos explicativos y las cajas de contexto
compiten con el dato, no lo acompañan.

## Elevation & Depth

Sistema **de borde primero**. Cada superficie se define por su contorno de `1px`
en `#E6E9F2`; la sombra existe solo para despegarla del lienzo, no para
jerarquizarla. Es una decisión de contexto: al sol, sobre un teléfono, un borde
nítido sobrevive donde una sombra suave desaparece.

### Shadow Vocabulary

- **Reposo de superficie** (`box-shadow: 0 4px 16px rgba(27,34,55,0.06)`): todas
  las tarjetas y paneles. Casi invisible por diseño.
- **Botón primario** (`box-shadow: 0 6px 16px rgba(3,66,146,0.25)`, hover
  `0 8px 22px rgba(3,66,146,0.35)`): la única sombra con color del sistema, y la
  única que jerarquiza. Marca lo que se puede apretar.

### Named Rules

**La Regla del Borde Primero.** Si hay que elegir entre subir la sombra o marcar
el borde, se marca el borde. La única excepción permitida es el botón primario,
que se despega a propósito porque invita a la acción.

**El desenfoque se gana su lugar una sola vez.** El sistema no usa vidrio como
decoración: la única pieza con `backdrop-filter` es el riel plegado de la
navegación pública, y está ahí por una razón concreta — flota sobre contenido
que puede ser una tarjeta blanca, el panel héroe oscuro o la foto de una
competición, y sin el velo los iconos se pierden sobre la mitad de esos fondos.
Cualquier otra superficie que quiera vidrio tiene que justificar lo mismo.

## Shapes

Lenguaje de esquina blanda pero contenida. Tres radios cargan el 90% del sistema:
`10px` en controles (botones, campos), `12px` en contenedores (tarjetas, paneles,
diálogos) y `999px` en todo lo que sea estado o etiqueta. Los radios grandes
(`16px` y `24px`) quedan reservados a piezas de respiro: tarjetas de métrica y
estados vacíos.

No hay bordes gruesos ni recortes geométricos. El único acento de forma es la
franja vertical de `4px` a la izquierda de la ficha de partido, que codifica el
estado por color.

### Named Rules

**La Regla de la Píldora.** Todo lo que describe un estado o clasifica algo es
una píldora completa (`999px`): división, categoría, estado del partido, contador.
Todo lo que contiene información es un rectángulo de `12px`. Nunca al revés — una
tarjeta con forma de píldora o un chip con esquina cuadrada rompen la lectura.

## Components

### Buttons

- **Shape:** esquina blanda (`10px`), sin mayúsculas forzadas, peso 600 en
  Jakarta.
- **Primary:** relleno Azul Nocturno con texto blanco, `9px 18px`, y la sombra
  azul propia del sistema. Sin elevación de Material (`disableElevation`): la
  sombra es la del token, no la de MUI.
- **Hover / Focus:** oscurece a `#023575` y la sombra crece de 6px a 8px de
  desplazamiento. Transición de `0.2s`.
- **Text:** el patrón de "Volver" en las pantallas públicas — sin relleno, texto
  en Tinta Suave, icono de flecha a la izquierda.

### Chips

- **Style:** píldora de `24px` de alto, texto de `11–12px` en peso 600–700.
  Variante contorneada por defecto; rellena solo cuando codifica un estado fuerte.
- **State:** el chip de en vivo se rellena en Rojo Directo con texto blanco y
  lleva el punto latiente adelante. Sobre fondo oscuro, todos los chips pasan a
  contorno blanco al 45% con relleno blanco al 12%.

### Cards / Containers

- **Corner Style:** `12px`.
- **Background:** Superficie sobre lienzo Papel.
- **Shadow Strategy:** reposo de superficie (ver Elevation).
- **Border:** `1px` en Borde. Siempre presente.
- **Internal Padding:** `16px` en móvil, `20–24px` en escritorio.

### Inputs / Fields

- **Style:** relleno en Superficie Elevada con contorno en Borde y radio de
  `10px`. El campo se hunde respecto de la tarjeta que lo contiene.
- **Focus:** el contorno pasa a Azul Nocturno con el grosor de MUI.
- **Error:** contorno y texto de ayuda en Rojo Error, nunca en Rojo Directo.

### Navigation

- **Público:** dos piezas con trabajos distintos.
  - *Barra superior* (`72px`, `60px` en teléfono): lo que es del sitio entero y no
    del recorrido — botón de plegado, logo circular de `38px` con el nombre de la
    liga en Jakarta 800, interruptor de tema y botón de sesión. En teléfono el
    nombre cae a la sigla **LLF** para que el botón de sesión siga entrando.
  - *Columna lateral* (`244px`, riel de `76px`): solo destinos. Item activo con
    fondo Azul Nocturno Suave, radio de `12px` y peso 700; en reposo, Tinta Suave.
    Plegada muestra solo iconos con el rótulo en tooltip a la derecha. En "En
    vivo" lleva el contador de partidos en curso — píldora en Rojo Directo
    desplegada, punto latiente en el riel. En teléfono la columna es un cajón que
    entra por debajo de la barra superior.
  - *El riel plegado no es superficie, es velo.* Pierde el fondo y el borde y
    pasa a un velo traslúcido con `backdrop-filter: blur(14px) saturate(140%)`.
    Lo que se ve a través es el fondo de la página, no el contenido: el contenido
    siempre arranca después del riel. Dejándolo correr por debajo, las tarjetas
    se metían bajo los iconos — el velo terminaba dejando ver justo lo que
    estaba tapando. Al abrirse, la columna vuelve a superficie sólida.
  - Es lo que le permite plegarse sin esconder nada: al mudar marca, tema y
    sesión a la barra, la columna queda siendo pura navegación.
- **Con sesión:** barra lateral colapsable; item activo con fondo Azul Nocturno
  Suave, radio de `12px` y peso 700; en reposo, texto en Tinta Suave.

### Panel héroe

Bloque de ancho completo con degradado `linear-gradient(135deg,#2A3352,#1B2237)`,
radio de `12px` y texto blanco, con el secundario a `rgba(255,255,255,0.65)`. Es
la única superficie oscura del modo claro y marca el contexto de la pantalla
(edición en curso, entidad que se está viendo).

### Ficha de partido

El componente firma del sistema. Tarjeta con **franja vertical de `4px`** a la
izquierda que codifica el estado —Rojo Directo en vivo, Verde Cerrado finalizado,
Ámbar pospuesto, Borde programado—, escudos de `40px`, marcador en Jakarta con
números tabulares y el ganador en peso 800. Sube `3px` al pasar el cursor en
`0.18s`.

### Portada de competición

Pieza alta con la foto del torneo de fondo a su proporción real, degradado
oscuro de abajo hacia arriba (`rgba(12,16,28,0.10)` → `0.90`) y el nombre en
Jakarta 800 con sombra de texto. Sin foto cargada cae al degradado de marca con
el balón como marca de agua al 14%.

### Movimiento

Vocabulario corto y consistente, con framer-motion:

- **Entrada de lista:** `opacity 0→1` y `y 10→0` en `0.2s`, escalonado `0.03s` por
  item con tope de `0.24s`.
- **Hover de tarjeta:** `y: -2` a `-4` según el peso de la pieza, en `0.18s`.
- **Latido de en vivo:** `pulse` de `1.4s` infinito — opacidad `1 → 0.45` y escala
  `1 → 0.82`.
- **Números:** las métricas cuentan desde cero en `0.8s` con `easeOut`.
- Todo el vocabulario se apaga bajo `prefers-reduced-motion: reduce`.

## Do's and Don'ts

### Do:

- **Do** definir toda superficie con su borde de `1px` en `#E6E9F2` antes de
  pensar en la sombra.
- **Do** usar `#FF3B53` únicamente para lo que está ocurriendo en este momento, y
  `#EF4444` para errores y acciones destructivas.
- **Do** poner números comparables en Plus Jakarta Sans con `tabular-nums`.
- **Do** resolver la pregunta del visitante dentro del primer viewport móvil.
- **Do** dar a cada estado su píldora: división, categoría, estado del partido y
  contadores son chips de `999px`, nunca texto suelto.
- **Do** declarar el peso de cada imagen: se consume con datos móviles en la
  cancha.

### Don't:

- **Don't** subir el Naranja Bengala a segundo color de trabajo. Su valor es la
  escasez; si necesitás más énfasis, usá peso tipográfico o el azul.
- **Don't** apilar tarjetas dentro de tarjetas. Si un bloque necesita subdividirse,
  se separa con espacio y un encabezado, no con otra caja.
- **Don't** usar fondo blanco puro para el lienzo de una pantalla: rompe la
  definición de las superficies.
- **Don't** poner texto en degradado ni sombras duras de desplazamiento; la
  jerarquía sale del peso y del tamaño.
- **Don't** animar propiedades de layout (`margin`, `width`, `height`). El
  vocabulario de movimiento es `transform` y `opacity`.
- **Don't** dejar un rótulo decorativo arriba de un título. El título se sostiene
  solo y el rótulo empuja el dato fuera de la pantalla.
