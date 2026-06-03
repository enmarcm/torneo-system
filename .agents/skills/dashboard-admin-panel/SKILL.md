---
name: dashboard-admin-panel
version: 1.0
description: "Dashboard & Admin Panel Development Skill. Diseño y desarrollo de dashboards, paneles administrativos, backoffice, CRM, ERP, analíticas y sistemas internos empresariales."
author: "General"
tags: [dashboard, admin-panel, backoffice, ui, ux, frontend, responsive, dark-mode, tables, forms, analytics, enterprise]
---

# Dashboard & Admin Panel Development Skill

## 1. Rol
Frontend Senior + UI/UX Designer especializado en dashboards, paneles administrativos, backoffice, CRM, ERP y sistemas internos. Profesional que entiende diseño y desarrollo frontend.

## 2. Objetivo
Construir/mejorar: dashboards ejecutivos, paneles admin, backoffice, CRM, ERP, módulos analítica, gestores (usuarios, inventario, pedidos), plataformas SaaS.

Resultado: profesional, moderno, limpio, ordenado, minimalista funcional, responsive, accesible, escalable, mantenible.

## 3. Principios
- **Claridad primero**: ¿dónde estoy? ¿qué es importante? ¿qué hago?
- **Jerarquía visual**: nombre → descripción → acciones → métricas → filtros → contenido → secundarias → estados.
- **Minimalismo funcional**: buen espaciado, tipografía legible, color con intención, cards agrupadas, sombras sutiles.
- **Consistencia**: botones, inputs, cards, tablas, badges, modales, dark mode.

## 4. Estructura base
```
┌─────────────────────────────┐
│ Navbar superior             │
├──────────┬──────────────────┤
│ Sidebar  │ Contenido        │
│          │ Header           │
│ Nav      │ Métricas         │
│ Módulos  │ Filtros          │
│ Usuario  │ Tabla/Form       │
└──────────┴──────────────────┘
```

### Sidebar
Logo, navegación, íconos claros, activo visible, agrupar si muchos, modo oscuro, cerrar sesión, footer discreto. En móvil → drawer/bottom nav. **Activo debe distinguirse sin depender solo del color.**

### Navbar
Título vista, breadcrumb, buscador, notificaciones, selector (sede/edición), perfil, acciones. Sticky solo si aporta. Simplificar en móvil.

### Contenido
Header claro, subtítulo, acciones, métricas, filtros, tabla/lista/gráfico/formulario, paginación, estados (vacío/carga/error).

## 5. Dashboard
Responder: estado general, métricas importantes, atención, tendencia, acción.

### Cards de métricas
Título claro, valor grande, descripción, ícono, **tooltip explicativo**, color, tendencia, loading/empty/hover.

Ejemplo:
```
[icono] Total de usuarios  (?)
1.248
Usuarios registrados
↑ 12% vs mes anterior
```

### Tooltips en métricas
Toda métrica no obvia debe tener explicación. Nunca usar siglas sin explicación.

### Gráficos
Para tendencias, comparaciones, distribuciones, progreso, cumplimiento, alertas. Título claro, leyendas, tooltips, loading/empty, no saturar.

## 6. Tablas
Encabezados claros, filas con espaciado, hover, zebra sutil si ayuda, acciones claras, badges para estados, paginación, orden, filtros, buscador, estados (vacío/loading/responsive).

**Acciones**: compactas (Ver/Editar/Eliminar), menú kebab (⋯ → Ver/Editar/Copiar/Eliminar) o dropdown.

**Badges**: Activo, Inactivo, Pendiente, Aprobado, Rechazado, En proceso, Error, Finalizado. Acompañar color con texto.

## 7. Formularios
Título, descripción, campos agrupados, labels claros, placeholder útil, texto de ayuda, validación visual, mensajes concretos, botón principal claro, loading al guardar.

Errores humanos: "El correo debe tener un formato válido, por ejemplo usuario@empresa.com". Nunca "Campo inválido".

## 8. Modales, drawers, confirmaciones
- **Modales**: acciones puntuales (confirmar eliminar, crear rápido, editar breve, ver resumen). Título, descripción, acción principal, secundaria, cierre, animación, overlay, responsive.
- **Drawers**: formularios largos, detalles laterales, configuraciones, filtros avanzados.
- **Confirmaciones**: destructivas (eliminar, desactivar). Botón rojo diferenciado.

## 9. Filtros y búsqueda
Tipos: texto, estado, fecha, categoría, usuario, sede, rango, orden. Reglas: mostrar activos, permitir limpiar, evitar muchos visibles, avanzados si muchos, búsqueda visible si clave, en móvil → drawer/colapsable.

## 10. Login
Seguro, limpio, profesional. Logo, título, subtítulo, usuario/correo, contraseña, botón principal, loading, error humano, responsive. Campo contraseña con botón ojo mostrar/ocultar, `aria-label`.

Errores humanos: "Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente."

## 11. Dark mode
Diseñado, no improvisado. No negro puro, fondos oscuros suaves, contraste alto, revisar tablas/inputs/modales/tooltips/gráficos, acentos visibles, no saturar.

Paleta sugerida:
```css
:root {
  --bg: #f8fafc; --surface: #fff; --border: #e2e8f0;
  --text: #0f172a; --muted: #64748b;
  --primary: #2563eb; --primary-hover: #1d4ed8;
  --danger: #dc2626; --success: #16a34a; --warning: #f59e0b;
}
[data-theme="dark"] {
  --bg: #07111f; --surface: #0f1f35; --border: rgba(255,255,255,.10);
  --text: #f8fafc; --muted: #a8b3c7;
  --primary: #3b82f6; --primary-hover: #60a5fa;
  --danger: #f87171; --success: #4ade80; --warning: #fbbf24;
}
```

**Persistencia**: localStorage + contexto global + store + `prefers-color-scheme`.

## 12. Animaciones
Aplicar a: entrada cards, tabs, hover botones, modales, dropdowns, login, vacíos, loading, sidebar hover.
**Reglas**: 150-300ms, `transform`/`opacity`, evitar width/height grandes, `prefers-reduced-motion`, evitar rebotes.

## 13. Botones
Tipos: primario, secundario, ghost, destructivo, icon. Jerarquía clara. Hover, focus, active, disabled, loading, tamaño táctil, íconos solo si ayudan, texto claro.
- Primario: acción principal. Secundario: alternativa. Ghost: ligera. Destructivo: eliminar. Icon: compactas.
- Evitar: "OK", "Enviar", "Procesar", "Click aquí" sin contexto.

## 14. Estados
- **Vacío**: "No hay registros. Crea el primero para comenzar." + botón.
- **Loading**: skeletons en tablas/cards. Spinners solo en acciones puntuales. Botones con estado.
- **Error**: "No pudimos cargar los datos. Revisa tu conexión." + "Reintentar". Nunca errores técnicos crudos.

## 15. Responsive
Móvil, tablet, laptop, desktop, pantallas grandes. Sin overflow horizontal. Cards en 1 columna en móvil. Sidebar colapsado/drawer. Tablas con scroll o versión cards. Botones con tamaño táctil. Modales adaptativos. Filtros colapsables. Navbar simplificada.

## 16. Accesibilidad
Contraste, labels visibles, `aria-label` en iconos, focus visible, navegación teclado, tooltips accesibles, alt en imágenes, no depender solo del color, fuentes legibles, estados error claros.

## 17. Arquitectura frontend
```
src/
  components/
    layout/   (Sidebar, Navbar, PageHeader)
    ui/       (Button, Card, Input, Badge, Tooltip, Modal, DataTable)
    dashboard/ (MetricCard, ChartCard)
  pages/ or app/
  hooks/  services/  utils/  styles/  constants/
```

**Principios**: componentes reutilizables, no duplicar estilos, separar API de UI, hooks para lógica, nombres claros, sin dependencias innecesarias.

## 18. Rediseñar un admin existente
1. Identificar framework. 2. Revisar rutas. 3. Revisar layout. 4. Sidebar/navbar. 5. Sistema de estilos. 6. Componentes. 7. Assets. 8. Formularios. 9. Tablas. 10. Estados. 11. Responsive. 12. Dark mode.

Durante cambios: no romper lógica, no cambiar endpoints, no alterar datos sin permiso, no eliminar validaciones, no eliminar permisos, no cambiar rutas sin razón.

Después: probar build, responsive, light/dark, formularios, acciones tabla, login, modales, vacíos.

## 19. Checklist de calidad
- [ ] Jerarquía clara.
- [ ] Dashboard explica métricas (tooltips).
- [ ] Tablas legibles.
- [ ] Formularios con labels y ayudas.
- [ ] Botones con estados completos.
- [ ] Estados vacíos diseñados.
- [ ] Loading adecuado.
- [ ] Errores entendibles.
- [ ] Sidebar sin scroll innecesario.
- [ ] Navbar sin saturar.
- [ ] Funciona en móvil.
- [ ] Dark mode consistente.
- [ ] Animaciones suaves.
- [ ] Accesibilidad básica.
- [ ] No se rompió funcionalidad.
- [ ] Sin dependencias innecesarias.

## 20. Prompt base
```md
Actúa usando la skill "dashboard-admin-panel".
Analiza este proyecto/pantalla administrativa y mejora su diseño sin romper funcionalidad.
Objetivos: layout, dashboard, cards métricas, tablas, formularios, modales, sidebar/navbar, responsive, dark mode, tooltips, animaciones, estados.
Reglas: no rehacer desde cero si hay estructura, no romper rutas/endpoints/lógica, no eliminar validaciones, no agregar deps innecesarias, código limpio y reutilizable.
Revisa estructura actual, luego aplica cambios y entrega resumen de archivos modificados.
```

## 21. Resultado esperado
Panel más claro, bonito, rápido de entender, profesional, consistente, mejor en móvil, mejor en dark mode, mejor en tablas/formularios, mejor feedback visual, preparado para crecer.
