/**
 * Constantes JWT compartidas para desarrollo.
 *
 * Como no existe HU de login, se utiliza un token quemado (hardcoded)
 * que todas las HU y pruebas consumen de manera uniforme.
 *
 * Payload del token:
 *   { "sub": "test-user-123", "name": "Tutor de prueba", "iat": 1751000000 }
 */

/** Secret usado para firmar el token de desarrollo */
export const JWT_SECRET = 'poli-tutorias-dev-secret';

/** ID del usuario de prueba (claim `sub` del JWT) */
export const TEST_USER_ID = 'test-user-123';

/**
 * Token JWT firmado con HS256 y el secret de desarrollo.
 * Úsalo en Swagger, Postman o cualquier cliente HTTP:
 *   Authorization: Bearer <DEV_JWT_TOKEN>
 */
export const DEV_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwibmFtZSI6IlR1dG9yIGRlIHBydWViYSIsImlhdCI6MTc1MTAwMDAwMH0.' +
  'pp89wDdOBhsD5iM28iMt1obYqud3xVAUIQlNMiwkl0A';
