/**
 * Contenido inicial de la configuración y de las páginas legales.
 *
 * Los textos legales son una BASE redactada según lo que el sitio realmente
 * hace (datos de jugadores y delegados, foto del documento, cookie de sesión
 * del staff, sin analítica ni publicidad de seguimiento). No sustituyen la
 * revisión de un abogado: el administrador los edita desde el panel.
 *
 * Los marcadores {{siteName}}, {{legalName}}, {{taxId}}, {{email}}, {{phone}} y
 * {{address}} se reemplazan al servir la página con los datos de la configuración.
 */

export const DEFAULT_SETTINGS = {
  siteName: 'Liga Lago Futsal',
  legalName: '',
  taxId: '',
  tagline: 'Resultados, posiciones y calendario de la liga, al minuto y en un solo lugar.',
  address: 'Colegio de Abogados del Estado Zulia · Maracaibo',
  phone: '+58 261 000 0000',
  email: 'contacto@ligalagofutsal.com',
  schedule: 'Partidos: viernes y sábados, 18:00 a 23:00',
  whatsapp: '',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  logoUrl: '',
  logoDarkUrl: '',
};

export interface DefaultLegalPage {
  slug: string;
  title: string;
  sortOrder: number;
  body: string;
}

export const DEFAULT_LEGAL_PAGES: DefaultLegalPage[] = [
  {
    slug: 'terminos-y-condiciones',
    title: 'Términos y condiciones',
    sortOrder: 1,
    body: `Al usar este sitio aceptas estos términos. Si no estás de acuerdo, te pedimos que no lo uses.

## Qué es este sitio
{{siteName}} es la plataforma donde se publican los resultados, tablas de posiciones, calendarios, noticias y estadísticas de la liga, y donde los delegados de los equipos gestionan sus inscripciones y plantillas.

## Uso permitido
Puedes consultar el contenido público libremente. No está permitido intentar acceder a áreas restringidas sin autorización, alterar o sobrecargar el servicio, ni usar el sitio para fines ilícitos.

## Cuentas de delegados y personal
Las cuentas las crea la administración de la liga. Quien las usa es responsable de mantener su contraseña en reserva y de la información que registra, incluida la de los jugadores de su equipo. Antes de registrar a un jugador debe contar con su autorización (o la de su representante legal, si es menor de edad), conservarla por escrito y entregarla a la liga cuando esta se la solicite. Al registrar a un jugador menor de edad, el delegado declara que tiene la autorización firmada de su representante legal para publicar su nombre, fotografía y resultados deportivos en los términos de la página «Autorización de publicación de menores de edad», y responde por esa declaración.

## Información de partidos y estadísticas
Hacemos lo posible por mantener los resultados al día, pero pueden existir errores o retrasos. Los resultados oficiales son los que determine la organización de la liga, que puede corregirlos cuando sea necesario.

## Propiedad intelectual
El nombre, el escudo, el diseño y los textos del sitio pertenecen a {{siteName}} o a sus titulares. Los escudos y fotos de equipos y jugadores pertenecen a sus respectivos dueños y se publican con su autorización. No puedes reproducir el contenido con fines comerciales sin permiso por escrito.

## Publicidad y enlaces
El sitio puede mostrar publicidad de patrocinadores y enlaces a páginas de terceros. No controlamos esos sitios ni somos responsables de su contenido.

## Limitación de responsabilidad
El sitio se ofrece tal como está. No garantizamos que funcione sin interrupciones y no respondemos por daños derivados de su uso, salvo lo que establezca la ley.

## Cambios
Podemos modificar estos términos. La versión vigente es la publicada en esta página.

## Ley aplicable
Estos términos se rigen por las leyes de la República Bolivariana de Venezuela.

## Contacto
Para consultas sobre estos términos escríbenos a {{email}}.`,
  },
  {
    slug: 'politica-de-privacidad',
    title: 'Política de privacidad',
    sortOrder: 2,
    body: `Esta política explica qué datos personales trata {{siteName}}, para qué y qué derechos tienes sobre ellos.

## Quién es el responsable
{{legalName}} {{taxId}}, con domicilio en {{address}}. Puedes escribirnos a {{email}}.

## Qué datos tratamos
- De los jugadores: nombre, apellido, fecha de nacimiento, número de documento, fotografía y fotografía del documento de identidad, equipo y estadísticas de juego (goles, tarjetas, partidos).
- De los delegados y del personal: nombre de usuario, correo, contraseña (guardada cifrada) y registro de las acciones que realizan en el panel, con su dirección IP.
- De los visitantes: no pedimos registro. El servidor puede registrar datos técnicos básicos (dirección IP, navegador, fecha) por seguridad.

## Para qué los usamos
Organizar los torneos: inscribir equipos y jugadores, verificar identidad y edad, programar partidos, registrar resultados y publicar estadísticas. También para la seguridad del sitio y para atender tus solicitudes.

## Qué se publica
En el sitio público aparecen el nombre del jugador, su equipo, su foto y sus estadísticas deportivas. La fotografía del documento de identidad no es pública: se guarda en un almacenamiento privado y solo la ven la administración y el delegado del equipo del jugador, para verificar la inscripción. Esto incluye a los jugadores menores de edad, cuya publicación se ampara en la autorización de su representante legal (ver «Autorización de publicación de menores de edad»); de un menor no se publica el número de documento completo, la fecha de nacimiento, el domicilio ni datos de contacto.

## Menores de edad
Si el jugador es menor de edad, la publicación de su nombre, fotografía y resultados deportivos se basa en la autorización de su padre, madre o representante legal, que el delegado del equipo declara tener firmada al registrarlo (ver «Autorización de publicación de menores de edad»). Tratamos sus datos solo con fines deportivos y no los cedemos con fines comerciales. El representante puede retirar la autorización en cualquier momento escribiéndonos a {{email}}; en ese caso dejaremos de mostrar la fotografía y el apellido completo del menor en un plazo máximo de 5 días hábiles.

## Con quién los compartimos
No vendemos datos personales. Los tratan únicamente los proveedores que alojan el sitio y sus archivos, bajo nuestras instrucciones. Podemos entregarlos a una autoridad si la ley lo exige.

## Cuánto tiempo los conservamos
Mientras el jugador o el equipo participe en la liga y después, el tiempo necesario para conservar el historial deportivo (los equipos y sus resultados no se borran). Puedes pedir que se retire tu fotografía o tus datos de contacto.

## Tus derechos
Puedes pedir acceso, rectificación, actualización o eliminación de tus datos, y oponerte a su tratamiento, escribiendo a {{email}}. Responderemos en un plazo razonable.

## Seguridad
Las contraseñas se guardan cifradas, el acceso al panel exige autenticación y las acciones del personal quedan registradas. Ningún sistema es infalible, pero tomamos medidas razonables para proteger tu información.

## Cambios
Si cambiamos esta política, publicaremos la nueva versión en esta página.`,
  },
  {
    slug: 'politica-de-cookies',
    title: 'Política de cookies',
    sortOrder: 3,
    body: `Esta página explica qué almacenamiento usa {{siteName}} en tu dispositivo.

## Qué usamos
- Cookie de sesión (solo personal y delegados): se crea al iniciar sesión en el panel y es necesaria para mantener la sesión. Los visitantes que solo consultan el sitio no la reciben.
- Almacenamiento local del navegador: guarda tus preferencias, como el modo claro u oscuro. No contiene datos personales.
- Instalación como aplicación: si instalas el sitio en tu teléfono, el navegador guarda una copia mínima para mostrar una pantalla de aviso cuando no hay conexión.

## Qué no usamos
No usamos cookies de analítica, de publicidad personalizada ni de seguimiento entre sitios.

## Servicios de terceros
El sitio carga las tipografías desde Google Fonts, lo que implica que tu navegador se comunica con los servidores de Google. Los anuncios de patrocinadores pueden enlazar a sus propias páginas, que tienen sus propias políticas.

## Cómo controlarlas
Puedes borrar las cookies y el almacenamiento local desde la configuración de tu navegador. Si bloqueas la cookie de sesión, no podrás iniciar sesión en el panel.

## Contacto
Escríbenos a {{email}} si tienes dudas.`,
  },
  {
    slug: 'derechos-de-imagen',
    title: 'Derechos de imagen y menores',
    sortOrder: 4,
    body: `{{siteName}} publica fotografías y videos de partidos, jugadores y equipos. Esta página explica cómo se manejan.

## Qué publicamos
Fotos y videos de los partidos, retratos de jugadores, escudos de equipos y material de las noticias y fichas del sitio y de nuestras redes sociales.

## Autorización
Al inscribirse en la liga, el jugador (o su representante legal, si es menor de edad) autoriza el uso de su imagen y de su nombre para fines deportivos y de difusión de la liga. En el caso de los menores, la autorización se otorga en los términos de la página «Autorización de publicación de menores de edad». El delegado del equipo es responsable de contar con esa autorización antes de registrar al jugador.

## Menores de edad
Respetamos el derecho de los niños, niñas y adolescentes al honor, a la reputación y a la propia imagen, conforme a la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes. No publicamos datos de contacto, domicilio ni documentos de identidad de menores. Su imagen y su nombre se publican únicamente con la autorización de su representante legal, que puede retirarse en cualquier momento (ver «Autorización de publicación de menores de edad»).

## Retirar una imagen
Si apareces en una foto o video y quieres que se retire (o lo pides en nombre de un menor a tu cargo), escríbenos a {{email}} indicando en qué página está. La retiraremos a la brevedad.

## Imágenes de terceros
Los escudos, logos y marcas de patrocinadores pertenecen a sus titulares y se muestran con su autorización.`,
  },
  {
    slug: 'autorizacion-de-menores',
    title: 'Autorización de publicación de menores de edad',
    sortOrder: 5,
    body: `Esta página recoge los términos de la autorización para publicar a los jugadores menores de edad de {{siteName}}. Se otorga cuando el delegado de un equipo registra a un menor en la plataforma, en nombre y con la autorización de su padre, madre o representante legal.

## Qué se autoriza
La publicación, en el sitio web, la aplicación y las redes sociales de {{siteName}}, de:
- el nombre y apellido del jugador y su fotografía;
- el equipo al que pertenece, su posición y su número de camiseta;
- sus resultados deportivos: partidos, goles, asistencias, tarjetas y reconocimientos como jugador del partido;
- las fotos y videos de los partidos en los que participe.

## Qué no se publica
El número completo de cédula o partida de nacimiento, la fecha de nacimiento, el domicilio, el teléfono, el correo, la fotografía del documento de identidad ni ningún dato de salud. Los documentos se guardan en un almacenamiento privado y solo sirven para verificar la inscripción y la categoría del jugador.

## Para qué se usa
Únicamente con fines deportivos e informativos: dar a conocer los resultados, las tablas y las estadísticas de la liga. La imagen o el nombre del menor no se cederán a terceros con fines comerciales ni se usarán en publicidad de patrocinadores sin una autorización adicional y expresa de su representante.

## Quién la otorga
El padre, la madre o el representante legal del menor. Quien lo registra (el delegado del equipo) declara, al hacerlo, que tiene esa autorización firmada, que la conservará y que la entregará a la liga cuando esta se la pida. Si no la presenta, la liga puede dejar de mostrar al menor con su nombre completo y fotografía.

## Es voluntaria y gratuita
Nadie está obligado a otorgarla. Sin ella no se registra al menor en la plataforma. No genera ningún pago ni contraprestación.

## Cuánto dura
Mientras el menor participe en la liga y durante el tiempo en que se conserve el historial deportivo, salvo que el representante la retire.

## Cómo retirarla
En cualquier momento y sin dar explicaciones, escribiendo a {{email}} con el nombre del jugador y del representante. En un plazo máximo de 5 días hábiles dejaremos de mostrar la fotografía y el apellido completo del menor en el sitio y retiraremos las publicaciones propias que dependan de nosotros. No podemos deshacer copias que un tercero ya haya descargado o compartido por su cuenta.

## Marco aplicable
Respetamos el interés superior del niño, niña y adolescente y su derecho al honor, a la reputación, a la propia imagen y a la vida privada, conforme a la Constitución y a la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes de la República Bolivariana de Venezuela.`,
  },
  {
    slug: 'aviso-legal',
    title: 'Aviso legal',
    sortOrder: 6,
    body: `## Titular del sitio
Nombre comercial: {{siteName}}
Razón social: {{legalName}}
Documento fiscal: {{taxId}}
Domicilio: {{address}}
Teléfono: {{phone}}
Correo: {{email}}

## Objeto
Este sitio informa sobre la actividad deportiva de la liga y ofrece herramientas de gestión a los equipos participantes.

## Responsabilidad sobre el contenido
Procuramos que la información sea exacta y esté actualizada, pero no nos hacemos responsables de errores u omisiones puntuales. Si detectas un error, avísanos en {{email}}.

## Propiedad intelectual
Los contenidos, el diseño y las marcas del sitio están protegidos por la normativa de propiedad intelectual aplicable. Queda prohibida su reproducción total o parcial sin autorización.

## Legislación aplicable
Este aviso se rige por las leyes de la República Bolivariana de Venezuela.`,
  },
];
