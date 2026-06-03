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
};

export const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
export const DOC_MIME = ['image/jpeg', 'image/png', 'application/pdf'];
