/**
 * Utilidad de Ventana Activa de Solicitudes
 *
 * Resuelve la ambigüedad de SOL-01 ("semana en curso") unificando
 * CAL-02 y CAL-03 en un único concepto: la "ventana activa".
 *
 * Regla:
 *   - Lun 00:00 → Dom 19:59 → ventana = semana actual (Lun-Dom presentes)
 *   - Dom 20:00 → Dom 23:59 → ventana = semana siguiente (Lun-Dom próximos)
 *
 * Todas las comparaciones usan zona horaria Ecuador (UTC-5)
 * para coherencia con la fecha local del usuario.
 */

export interface ActiveWindow {
  /** Lunes 00:00:00 (local Ecuador) de la ventana activa */
  inicio: Date;
  /** Domingo 23:59:59 (local Ecuador) de la ventana activa */
  fin: Date;
  /** Etiqueta legible: "semana actual" o "semana siguiente" */
  label: 'semana actual' | 'semana siguiente';
}

/**
 * Devuelve el Date correspondiente al lunes de la semana a la que pertenece `ref`.
 * getDay() → 0=Dom, 1=Lun, ..., 6=Sáb
 */
function getMondayOf(ref: Date): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + daysToMonday);
  return d;
}

/**
 * Calcula la ventana activa dado un momento `ahora`.
 *
 * @param ahora Momento de referencia. Por defecto new Date() (ahora mismo).
 */
export function calcularVentanaActiva(ahora: Date = new Date()): ActiveWindow {
  const esDomingoPost20 =
    ahora.getDay() === 0 && ahora.getHours() >= 20;

  const mondayBase = getMondayOf(ahora);

  if (esDomingoPost20) {
    // CAL-03: a partir del Dom 20:00, la ventana ya es la semana siguiente
    const mondayNext = new Date(mondayBase);
    mondayNext.setDate(mondayBase.getDate() + 7);

    const sundayNext = new Date(mondayNext);
    sundayNext.setDate(mondayNext.getDate() + 6);
    sundayNext.setHours(23, 59, 59, 999);

    return { inicio: mondayNext, fin: sundayNext, label: 'semana siguiente' };
  }

  // Semana actual: lunes de esta semana → domingo a las 23:59:59
  const sunday = new Date(mondayBase);
  sunday.setDate(mondayBase.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { inicio: mondayBase, fin: sunday, label: 'semana actual' };
}

/**
 * Verifica si una fecha (string 'YYYY-MM-DD') cae dentro de la ventana activa.
 *
 * @param fechaStr Fecha en formato 'YYYY-MM-DD' (sin zona horaria)
 * @param ventana  Ventana activa calculada con `calcularVentanaActiva()`
 */
export function fechaEnVentanaActiva(
  fechaStr: string,
  ventana: ActiveWindow,
): boolean {
  // Parsear como local noon para evitar problemas de TZ en UTC
  const [year, month, day] = fechaStr.split('-').map(Number);
  const fecha = new Date(year, month - 1, day, 12, 0, 0);
  return fecha >= ventana.inicio && fecha <= ventana.fin;
}

/**
 * Verifica si un bloque horario cumple la anticipación mínima indicada.
 *
 * @param fechaStr    Fecha en formato 'YYYY-MM-DD'
 * @param horaStr     Hora en formato 'HH:MM'
 * @param minHoras    Horas mínimas de anticipación (default 12 — SOL-02)
 * @param ahora       Momento de referencia (default new Date())
 */
export function cumpleAnticipacionMinima(
  fechaStr: string,
  horaStr: string,
  minHoras = 12,
  ahora: Date = new Date(),
): boolean {
  const [year, month, day] = fechaStr.split('-').map(Number);
  const [h, m] = horaStr.split(':').map(Number);
  const slotDate = new Date(year, month - 1, day, h, m, 0, 0);
  const diffMs = slotDate.getTime() - ahora.getTime();
  return diffMs >= minHoras * 60 * 60 * 1000;
}

/**
 * Verifica si un bloque horario ya expiró (< 4 horas para el inicio — SOL-03).
 *
 * @param fechaStr  Fecha en formato 'YYYY-MM-DD'
 * @param horaStr   Hora en formato 'HH:MM'
 * @param ahora     Momento de referencia (default new Date())
 */
export function estaExpirado(
  fechaStr: string,
  horaStr: string,
  ahora: Date = new Date(),
): boolean {
  return !cumpleAnticipacionMinima(fechaStr, horaStr, 4, ahora);
}
