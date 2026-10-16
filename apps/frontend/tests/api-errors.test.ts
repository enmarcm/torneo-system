import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractErrorMessage } from '../src/utils/apiErrors';

test('shows all backend validation details instead of the generic message', () => {
  assert.equal(extractErrorMessage({ response: { data: { message: 'Datos inválidos', errors: [
    { field: 'password', message: 'Contraseña: Mínimo 6 caracteres' },
    { field: 'email', message: 'Correo: Ingresa un correo válido' },
  ] } } }), 'Contraseña: Mínimo 6 caracteres. Correo: Ingresa un correo válido');
  assert.equal(extractErrorMessage({ response: { data: { message: 'Datos inválidos', fields: { password: ['Mínimo 6 caracteres'], email: ['Correo inválido'] } } } }), 'Mínimo 6 caracteres. Correo inválido');
});

test('retains business errors, network failures and fallbacks', () => {
  assert.equal(extractErrorMessage({ response: { data: { message: 'El usuario ya existe' } }, message: 'Request failed' }), 'El usuario ya existe');
  assert.equal(extractErrorMessage(new Error('Sin conexión')), 'Sin conexión');
  assert.equal(extractErrorMessage(null, 'Intenta de nuevo'), 'Intenta de nuevo');
  assert.equal(extractErrorMessage({ response: { data: { fields: { password: [null, ''], unexpected: {} }, message: 'Datos inválidos' } } }), 'Datos inválidos');
});
