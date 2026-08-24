// Función para generar ID único formato LC-XXXXXX
export const generateUserId = () => {
  const randomNumber = Math.floor(Math.random() * 900000) + 100000
  return `LC-${randomNumber}`
}