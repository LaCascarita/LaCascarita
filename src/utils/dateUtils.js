import { addDays, nextWednesday, nextFriday, nextSunday, format } from 'date-fns'

/**
 * Calcula la fecha del próximo miércoles basado en la fecha actual
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getNextWednesday = () => {
  const today = new Date()
  const nextWed = nextWednesday(today)
  return format(nextWed, 'yyyy-MM-dd')
}

/**
 * Calcula la fecha del próximo viernes basado en la fecha actual
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getNextFriday = () => {
  const today = new Date()
  const nextFri = nextFriday(today)
  return format(nextFri, 'yyyy-MM-dd')
}

/**
 * Calcula la fecha del próximo domingo basado en la fecha actual
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getNextSunday = () => {
  const today = new Date()
  const nextSun = nextSunday(today)
  return format(nextSun, 'yyyy-MM-dd')
}

/**
 * Obtiene la fecha dinámica según el tipo de bolsa
 * @param {string} bagType - Tipo de bolsa: 'mediaSemana', 'finDeSemana', 'dominical'
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const getDynamicDate = (bagType) => {
  switch (bagType) {
    case 'mediaSemana':
      return getNextWednesday()
    case 'finDeSemana':
      return getNextFriday()
    case 'dominical':
      return getNextSunday()
    default:
      return format(new Date(), 'yyyy-MM-dd')
  }
}
