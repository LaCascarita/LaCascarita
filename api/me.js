import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'default_secret_change_in_production'

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Obtener token de las cookies
    const cookies = req.headers.cookie || ''
    const access_token = cookies.split('; ').find(cookie => cookie.startsWith('access_token='))?.split('=')[1]

    if (!access_token) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    // Verificar token
    const decoded = jwt.verify(access_token, JWT_SECRET)
    
    res.json({ user: decoded })

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token inválido' })
    }
    console.error('Error en /api/me:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}
