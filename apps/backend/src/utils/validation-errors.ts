import { z, type ZodError } from 'zod';

const labels: Record<string, string> = {
  username: 'Usuario', leaderUsername: 'Usuario del delegado', password: 'Contraseña',
  leaderPassword: 'Contraseña del delegado', currentPassword: 'Contraseña actual', newPassword: 'Contraseña nueva',
  email: 'Correo', name: 'Nombre', firstName: 'Nombre', lastName: 'Apellido',
  birthDate: 'Fecha de nacimiento', documentNumber: 'Número de documento', documentType: 'Tipo de documento',
  photoUrl: 'Foto del jugador', identityPhotoKey: 'Foto del documento', teamId: 'Equipo',
  competitionId: 'Competición', registrationId: 'Inscripción', role: 'Rol', status: 'Estado',
};

// Zod keeps explicit schema messages; translate its default messages centrally.
z.setErrorMap((issue) => {
  switch (issue.code) {
    case 'invalid_type': return { message: issue.received === 'undefined' || issue.received === 'null' ? 'Este campo es obligatorio' : 'El valor no tiene el formato esperado' };
    case 'too_small': return { message: issue.type === 'string' ? `Mínimo ${issue.minimum} caracteres` : issue.type === 'array' ? `Selecciona al menos ${issue.minimum} elementos` : `El valor debe ser ${issue.inclusive ? 'mayor o igual que' : 'mayor que'} ${issue.minimum}` };
    case 'too_big': return { message: issue.type === 'string' ? `Máximo ${issue.maximum} caracteres` : issue.type === 'array' ? `Selecciona como máximo ${issue.maximum} elementos` : `El valor debe ser ${issue.inclusive ? 'menor o igual que' : 'menor que'} ${issue.maximum}` };
    case 'invalid_string': return { message: issue.validation === 'email' ? 'Ingresa un correo válido' : issue.validation === 'url' ? 'Ingresa una dirección válida' : issue.validation === 'uuid' ? 'Selecciona una opción válida' : 'El formato no es válido' };
    case 'invalid_date': return { message: 'Ingresa una fecha válida' };
    case 'invalid_enum_value': case 'invalid_literal': return { message: 'Selecciona una opción válida' };
    case 'unrecognized_keys': return { message: 'Hay campos no admitidos' };
    default: return { message: 'El valor no es válido' };
  }
});

export const formatValidationErrors = (error: ZodError) => {
  const errors = error.issues.map((issue) => {
    const field = issue.path.join('.');
    const lastKey = [...issue.path].reverse().find((part) => typeof part === 'string');
    const label = lastKey ? labels[String(lastKey)] ?? 'Campo' : '';
    return { field, message: label ? `${label}: ${issue.message}` : issue.message };
  });
  return { message: [...new Set(errors.map((error) => error.message))].join('. '), errors, fields: error.flatten().fieldErrors };
};
