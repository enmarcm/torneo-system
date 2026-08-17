export const PAGINATION = { defaultLimit: 20, maxLimit: 100 };

export const MESSAGES = {
  notFound: 'Recurso no encontrado',
  forbidden: 'No autorizado',
  unauthorized: 'No autenticado',
  badCredentials: 'Correo o contraseña incorrectos',
  transfersClosed: 'Los traspasos están cerrados en este momento',
  rosterFull: 'La plantilla ya alcanzó el cupo máximo de jugadores',
  notEligibleAge: 'El jugador no cumple el rango de edad de esta competición',
  notEligibleAdmin: 'El jugador debe ser habilitado por el administrador para esta competición',
  duplicatePlayer: 'Ya existe un jugador con ese documento',
  fileTooLarge: 'El archivo supera el tamaño máximo permitido',
  invalidFileType: 'Tipo de archivo no permitido',
  teamBlocked: 'El equipo está bloqueado. Contacta al administrador del torneo',
  teamInactive: 'El equipo está desactivado. Contacta al administrador del torneo',
  teamBlockedInCompetition: 'El equipo está bloqueado en esta competición',
  alreadyBlocked: 'El equipo ya tiene un bloqueo activo con ese alcance',
  fixtureNeedsTeams: 'Se necesitan al menos 2 equipos inscritos para generar el calendario',
  fixtureExists: 'Ya hay partidos generados. Borra el calendario antes de volver a sortear',
  bracketNeedsTeams: 'La cantidad de clasificados debe ser potencia de 2 (4, 8, 16, 32…)',
  matchNotFinished: 'El partido debe estar finalizado para designar al MVP',
  mvpNotInMatch: 'El jugador designado no pertenece a ninguno de los dos equipos',
};

export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const DOC_MIME = ['image/jpeg', 'image/png', 'application/pdf'];
