---
name: Liga Lago Futsal
description: Interfaz de consulta y operación de la liga, con el azul de marca y superficies planas.
---

# Sistema visual de Liga Lago Futsal

La interfaz responde primero qué se juega, cómo quedó y cómo va el equipo. El sitio público se consulta desde el teléfono; el administrador y el delegado trabajan con los mismos objetos y el mismo lenguaje visual.

## Dirección

Taste Skill, variante **Accent ladder**, semilla **1427637260**, aplicada el 02-11-2026. Se conservaron la marca, los escudos, las fotografías existentes, el azul y las fuentes del proyecto mediante `--keep palette,type`.

La identidad está en los nombres de las competiciones, los escudos y el marcador real. El azul intenso ocupa acciones principales y datos; sus tintas claras agrupan información. Los estados tienen texto además de color. El modo oscuro conserva el navy de la identidad existente con superficies opacas, sin efectos de vidrio.

## Color y superficies

La fuente de verdad es `apps/frontend/src/theme/tokens.ts`.

| Función | Claro | Oscuro |
| --- | --- | --- |
| Acción primaria | `#034292` | `#4D93FF` |
| Lienzo | `#F4F6FB` | `#070B16` |
| Superficie | `#FFFFFF` | `#101828` |
| Texto | `#1A2138` | `#F2F5FC` |
| Texto secundario | `#58647C` | `#98A3BE` |
| Resumen de entidad | `#E0E8F4` | `#17243A` |

Las tarjetas tienen borde suave y ninguna sombra. Los menús y diálogos sí usan sombra porque flotan. Los controles tienen un borde más visible que los contenedores. El foco y la selección se definen en el tema. Las barras de desplazamiento se ven también sobre superficies claras.

No usar degradados, halos, vidrio ni iconos en cuadrados de colores como decoración. Sobre fotografías se permite un velo opaco neutro para garantizar legibilidad. Los colores semánticos claros se oscurecieron para mejorar el contraste del texto.

## Tipografía y jerarquía

- Plus Jakarta Sans: títulos, botones y cifras principales.
- Inter: párrafos, formularios y datos de trabajo.
- Título de pantalla: un `h1`, 22px en móvil y 24px en escritorio. La portada pública usa 28–38px.
- Texto: 14–15px con altura de línea de 1.5–1.6. Metadatos: 12–13px.
- Todas las cifras comparables usan números tabulares; las columnas numéricas se alinean a la derecha.
- Los valores reales de cero se muestran como `0`; los datos desconocidos se representan con un guion. Un error de red no se convierte en una cifra cero en el resumen administrativo.

## Retícula y navegación

La administración y el panel de equipo usan una barra lateral de 240px, plegable a 64px, y un área de contenido con márgenes iguales de 32px en escritorio y 16px en móvil. La barra superior contiene el contexto, la edición y la cuenta. La navegación lateral se guarda en un drawer por debajo de 900px y conserva sus etiquetas aunque el usuario haya plegado la barra de escritorio.

Los bloques comparten una separación de 16–24px. Las métricas muestran primero la etiqueta y luego el número, sin animaciones de conteo ni iconos decorativos. Los resúmenes de entidad son compactos y usan una tinta clara de marca. El encabezado no compite con el dato.

El sitio público usa un contenedor centrado `xl`. La portada tiene fotografía propia y completa la primera pantalla (`100svh`), detrás de la barra superior transparente. El contenido reserva el alto de la barra; el título y los accesos quedan centrados verticalmente y los escudos al pie. Al llegar el borde inferior del hero al de la barra, esta recupera su fondo. La jornada comienza debajo al desplazarse. En pantallas bajas o con texto ampliado, la portada puede crecer para mostrar todo el contenido. La navegación pública sigue siendo desplegable.

La franja de patrocinadores comparte el fondo navy del pie en ambos temas, con una línea blanca de 1px al 14% de opacidad entre ambos. El separador respeta el contenedor centrado y tiene márgenes de 24px en móvil y 32px en escritorio. Sus logos miden 32px de alto en móvil y 40px en escritorio, conservan los colores originales y llevan una sombra blanca que sigue su silueta mediante `drop-shadow`, también en el carrusel y con movimiento reducido.

## Componentes y estados

- `PageHeader`: título semántico, descripción breve y acciones adaptables.
- `StatCard`: etiqueta, valor y comparación opcional; no interpreta una tendencia como positiva sin contexto.
- `EntityHeroCard`: resumen plano, título de 20–24px y metadatos debajo.
- `DataTable`: cabecera sin banda de color, cifras tabulares, hover y foco, acciones en menú. En móvil se transforma en una lista con identidad, datos y menú por fila. La cabecera se mantiene dentro del área de desplazamiento.
- `StandingsTable`: tabla completa en una superficie ancha; resumen desplegable en móvil y en columnas estrechas del dashboard.
- `StatusBadge`: tinta suave y texto semántico, sin bordes saturados.
- `EmptyState` y `ErrorState`: conservan el contexto; la falla ofrece reintento y se anuncia mediante `role="alert"`.
- Los esqueletos conservan el tamaño de los datos y usan relleno plano sin brillo.

No envolver tarjetas de partidos en otra tarjeta solo para darles un marco. La marca de clasificación o descenso conserva su significado deportivo; el resto del color se reserva a estados, resultados y acciones.

## Interacción y accesibilidad

El contenido aparece al estar disponible: no hay portada que imponga una espera de tres segundos ni cascadas de entrada en las pantallas de trabajo. El movimiento se reserva a progreso, cambios de marcador y respuesta a controles, respetando la preferencia de movimiento reducido.

Los controles mantienen etiquetas accesibles, foco visible y áreas táctiles de al menos 44px en móvil. Las filas accionables permiten abrir el detalle con teclado. El enlace «Ir al contenido» lleva al área principal. La sesión, los permisos y las operaciones de dominio conservan su lógica.

## Alcance y verificación

Los tokens, el tema y los componentes anteriores se comparten entre todas las rutas públicas, administrativas y de equipo. La implementación y sus límites de verificación se registran en `docs/TASTE-SKILL.md`. Las respuestas ficticias usadas en QA viven únicamente en un navegador temporal y no forman parte de los datos de la aplicación.
