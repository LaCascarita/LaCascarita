import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccessToken, getRefreshToken, refreshAccessToken, clearTokens, isTokenExpired } from '../lib/auth'

export const useAuth = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const checkAndRefreshToken = () => {
      const accessToken = getAccessToken()
      const refreshToken = getRefreshToken()

      if (!accessToken || !refreshToken) {
        // No hay tokens, redirigir al login
        navigate('/login')
        return
      }

      // Verificar si el access token está expirado
      if (isTokenExpired(accessToken)) {
        // Intentar refrescar el token
        const newAccessToken = refreshAccessToken()

        if (!newAccessToken) {
          // No se pudo refrescar, redirigir al login
          clearTokens()
          navigate('/login')
          return
        }
      }

      // Configurar verificación periódica (cada 5 minutos)
      const interval = setInterval(() => {
        const currentAccessToken = getAccessToken()
        if (currentAccessToken && isTokenExpired(currentAccessToken)) {
          const newToken = refreshAccessToken()
          if (!newToken) {
            clearTokens()
            navigate('/login')
          }
        }
      }, 5 * 60 * 1000) // 5 minutos

      return () => clearInterval(interval)
    }

    checkAndRefreshToken()
  }, [navigate])

  return null
}
