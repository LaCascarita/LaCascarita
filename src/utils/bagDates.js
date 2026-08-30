// Helper para calcular fechas de las bolsas

export function getNextBagDate(bagType) {
  // Usar fechas específicas de prueba que sabemos que tienen partidos
  const testDates = {
    'media-semana': '2026-09-02', // Miércoles 2 de septiembre
    'fin-de-semana': '2026-09-04', // Viernes 4 de septiembre
    'dominical': '2026-09-06' // Domingo 6 de septiembre
  }
  
  // Para producción, descomentar el cálculo dinámico y comentar las fechas de prueba
  /*
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = domingo, 1 = lunes, etc.
  
  let targetDate = new Date(today)
  
  switch (bagType) {
    case 'media-semana':
      // Media semana: miércoles (día 3)
      const daysUntilWednesday = (3 - dayOfWeek + 7) % 7
      if (daysUntilWednesday === 0) {
        targetDate = today
      } else {
        targetDate.setDate(today.getDate() + daysUntilWednesday)
      }
      break
      
    case 'fin-de-semana':
      // Fin de semana: viernes (día 5)
      const daysUntilFriday = (5 - dayOfWeek + 7) % 7
      if (daysUntilFriday === 0) {
        targetDate = today
      } else {
        targetDate.setDate(today.getDate() + daysUntilFriday)
      }
      break
      
    case 'dominical':
      // Dominical: domingo (día 0)
      const daysUntilSunday = (0 - dayOfWeek + 7) % 7
      if (daysUntilSunday === 0) {
        targetDate = today
      } else {
        targetDate.setDate(today.getDate() + daysUntilSunday)
      }
      break
      
    default:
      return today.toISOString().split('T')[0]
  }
  
  return targetDate.toISOString().split('T')[0]
  */
  
  return testDates[bagType] || '2026-09-02'
}

// Para pruebas o fechas específicas
export function getBagDateForTesting(bagType) {
  // Fechas de prueba para asegurar que haya partidos
  const testDates = {
    'media-semana': '2026-09-02', // Miércoles 2 de septiembre
    'fin-de-semana': '2026-09-04', // Viernes 4 de septiembre
    'dominical': '2026-09-06' // Domingo 6 de septiembre
  }
  return testDates[bagType] || getNextBagDate(bagType)
}
