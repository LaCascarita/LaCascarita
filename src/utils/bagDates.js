// Helper para calcular fechas de las bolsas

export function getNextBagDate(bagType) {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = domingo, 1 = lunes, etc.
  
  let targetDate = new Date(today)
  
  switch (bagType) {
    case 'media-semana':
      // Media semana: miércoles (día 3)
      // Si hoy es miércoles, usar hoy. Si es después, usar el próximo miércoles
      const daysUntilWednesday = (3 - dayOfWeek + 7) % 7
      if (daysUntilWednesday === 0) {
        // Es miércoles, usar hoy
        targetDate = today
      } else {
        targetDate.setDate(today.getDate() + daysUntilWednesday)
      }
      break
      
    case 'fin-de-semana':
      // Fin de semana: viernes (día 5)
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7
      if (daysUntilFriday === 0) {
        // Es viernes, usar hoy
        targetDate = today
      } else {
        targetDate.setDate(today.getDate() + daysUntilFriday)
      }
      break
      
    case 'dominical':
      // Dominical: domingo (día 0)
      const daysUntilSunday = (0 - dayOfWeek + 7) % 7
      if (daysUntilSunday === 0) {
        // Es domingo, usar hoy
        targetDate = today
      } else {
        targetDate.setDate(today.getDate() + daysUntilSunday)
      }
      break
      
    default:
      return today.toISOString().split('T')[0]
  }
  
  return targetDate.toISOString().split('T')[0]
}

// Para pruebas o fechas específicas
export function getBagDateForTesting(bagType) {
  // Fechas de prueba para asegurar que haya partidos
  const testDates = {
    'media-semana': '2026-08-27', // Miércoles
    'fin-de-semana': '2026-08-29', // Viernes
    'dominical': '2026-08-30' // Domingo
  }
  return testDates[bagType] || getNextBagDate(bagType)
}
