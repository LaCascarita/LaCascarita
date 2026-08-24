import jwt from 'jsonwebtoken'

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'default_secret_change_in_production'
const JWT_EXPIRES_IN = import.meta.env.VITE_JWT_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = import.meta.env.VITE_REFRESH_TOKEN_EXPIRES_IN || '7d'

// Generar token de acceso
export const generateAccessToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

// Generar refresh token
export const generateRefreshToken = (userData) => {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })
}

// Verificar token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Guardar tokens en sessionStorage (más seguro que localStorage)
export const saveTokens = (accessToken, refreshToken) => {
  sessionStorage.setItem('access_token', accessToken)
  sessionStorage.setItem('refresh_token', refreshToken)
}

// Obtener tokens
export const getAccessToken = () => {
  return sessionStorage.getItem('access_token')
}

export const getRefreshToken = () => {
  return sessionStorage.getItem('refresh_token')
}

// Eliminar tokens
export const clearTokens = () => {
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('refresh_token')
}

// Obtener usuario del token
export const getUserFromToken = () => {
  const token = getAccessToken()
  if (!token) return null
  
  const decoded = verifyToken(token)
  return decoded
}

// Verificar si el token está expirado
export const isTokenExpired = (token) => {
  const decoded = verifyToken(token)
  if (!decoded) return true
  
  const now = Date.now() / 1000
  return decoded.exp < now
}

// Refrescar token de acceso
export const refreshAccessToken = () => {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null
  
  const decoded = verifyToken(refreshToken)
  if (!decoded) return null
  
  const newAccessToken = generateAccessToken({
    id: decoded.id,
    username: decoded.username,
    user_id: decoded.user_id,
    phone: decoded.phone,
    balance: decoded.balance
  })
  
  sessionStorage.setItem('access_token', newAccessToken)
  return newAccessToken
}
