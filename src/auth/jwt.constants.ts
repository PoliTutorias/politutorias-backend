/**
 * Constantes JWT compartidas.
 *
 * El secret se lee de la variable de entorno JWT_SECRET.
 * Si no está definida, usa un valor por defecto para desarrollo.
 */

/** Secret usado para firmar tokens JWT */
export const JWT_SECRET = process.env.JWT_SECRET || 'poli-tutorias-dev-secret';

/** ID del usuario de prueba (legacy, para backward compatibility con tests) */
export const TEST_USER_ID = 'test-user-123';

/**
 * Token JWT legacy — solo para backward compatibility con tests.
 * En producción, los tokens se generan dinámicamente en /api/auth/login.
 */
export const DEV_JWT_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJzdWIiOiJ0ZXN0LXVzZXItMTIzIiwibmFtZSI6IlR1dG9yIGRlIHBydWViYSIsImlhdCI6MTc1MTAwMDAwMH0.' +
  'pp89wDdOBhsD5iM28iMt1obYqud3xVAUIQlNMiwkl0A';
