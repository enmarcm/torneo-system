-- Autorización para publicar menores de edad: página nueva y cláusulas en los textos legales.
-- Los textos se reemplazan por fragmento: si el administrador ya editó esa frase, no se toca.

UPDATE "LegalPage" SET "body" = replace("body", $t$Debe contar con la autorización de cada jugador (o de su representante, si es menor de edad) antes de registrarlo.$t$, $t$Antes de registrar a un jugador debe contar con su autorización (o la de su representante legal, si es menor de edad), conservarla por escrito y entregarla a la liga cuando esta se la solicite. Al registrar a un jugador menor de edad, el delegado declara que tiene la autorización firmada de su representante legal para publicar su nombre, fotografía y resultados deportivos en los términos de la página «Autorización de publicación de menores de edad», y responde por esa declaración.$t$), "updatedAt" = now()
WHERE "body" LIKE $t$%Debe contar con la autorización de cada jugador (o de su representante, si es menor de edad) antes de registrarlo.%$t$;

UPDATE "LegalPage" SET "body" = replace("body", $t$La búsqueda de jugadores por documento está limitada para que no pueda usarse para averiguar si una persona está registrada.$t$, $t$Esto incluye a los jugadores menores de edad, cuya publicación se ampara en la autorización de su representante legal (ver «Autorización de publicación de menores de edad»); de un menor no se publica el número de documento completo, la fecha de nacimiento, el domicilio ni datos de contacto.$t$), "updatedAt" = now()
WHERE "body" LIKE $t$%La búsqueda de jugadores por documento está limitada para que no pueda usarse para averiguar si una persona está registrada.%$t$;

UPDATE "LegalPage" SET "body" = replace("body", $t$Si el jugador es menor de edad, su inscripción y la publicación de sus datos e imagen deben estar autorizadas por su padre, madre o representante. Puedes revocar esa autorización en cualquier momento escribiéndonos a {{email}}.$t$, $t$Si el jugador es menor de edad, la publicación de su nombre, fotografía y resultados deportivos se basa en la autorización de su padre, madre o representante legal, que el delegado del equipo declara tener firmada al registrarlo (ver «Autorización de publicación de menores de edad»). Tratamos sus datos solo con fines deportivos y no los cedemos con fines comerciales. El representante puede retirar la autorización en cualquier momento escribiéndonos a {{email}}; en ese caso dejaremos de mostrar la fotografía y el apellido completo del menor en un plazo máximo de 5 días hábiles.$t$), "updatedAt" = now()
WHERE "body" LIKE $t$%Si el jugador es menor de edad, su inscripción y la publicación de sus datos e imagen deben estar autorizadas por su padre, madre o representante. Puedes revocar esa autorización en cualquier momento escribiéndonos a {{email}}.%$t$;

UPDATE "LegalPage" SET "body" = replace("body", $t$Al inscribirse en la liga, el jugador (o su representante, si es menor de edad) autoriza el uso de su imagen y de su nombre para fines deportivos y de difusión de la liga.$t$, $t$Al inscribirse en la liga, el jugador (o su representante legal, si es menor de edad) autoriza el uso de su imagen y de su nombre para fines deportivos y de difusión de la liga. En el caso de los menores, la autorización se otorga en los términos de la página «Autorización de publicación de menores de edad».$t$), "updatedAt" = now()
WHERE "body" LIKE $t$%Al inscribirse en la liga, el jugador (o su representante, si es menor de edad) autoriza el uso de su imagen y de su nombre para fines deportivos y de difusión de la liga.%$t$;

UPDATE "LegalPage" SET "body" = replace("body", $t$No publicamos datos de contacto, domicilio ni documentos de identidad de menores.$t$, $t$No publicamos datos de contacto, domicilio ni documentos de identidad de menores. Su imagen y su nombre se publican únicamente con la autorización de su representante legal, que puede retirarse en cualquier momento (ver «Autorización de publicación de menores de edad»).$t$), "updatedAt" = now()
WHERE "body" LIKE $t$%No publicamos datos de contacto, domicilio ni documentos de identidad de menores.%$t$;

UPDATE "LegalPage" SET "sortOrder" = 6 WHERE "slug" = 'aviso-legal' AND "sortOrder" = 5;

INSERT INTO "LegalPage" ("id", "slug", "title", "body", "sortOrder", "updatedAt")
VALUES (gen_random_uuid()::text, $t$autorizacion-de-menores$t$, $t$Autorización de publicación de menores de edad$t$, $t$Esta página recoge los términos de la autorización para publicar a los jugadores menores de edad de {{siteName}}. Se otorga cuando el delegado de un equipo registra a un menor en la plataforma, en nombre y con la autorización de su padre, madre o representante legal.

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
Respetamos el interés superior del niño, niña y adolescente y su derecho al honor, a la reputación, a la propia imagen y a la vida privada, conforme a la Constitución y a la Ley Orgánica para la Protección de Niños, Niñas y Adolescentes de la República Bolivariana de Venezuela.$t$, 5, now())
ON CONFLICT ("slug") DO NOTHING;
