import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const MediaSemana = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Datos harcodeados de partidos
  const matches = [
    { id: 1, home: 'América', away: 'Chivas', date: 'Miércoles 21:00', league: 'Liga MX' },
    { id: 2, home: 'Flamengo', away: 'Palmeiras', date: 'Miércoles 19:30', league: 'Liga Brasileña' },
    { id: 3, home: 'Boca Juniors', away: 'River Plate', date: 'Miércoles 20:00', league: 'Liga Argentina' },
    { id: 4, home: 'Tigres', away: 'Monterrey', date: 'Miércoles 22:00', league: 'Liga MX' },
    { id: 5, home: 'São Paulo', away: 'Corinthians', date: 'Miércoles 18:00', league: 'Liga Brasileña' },
    { id: 6, home: 'Independiente', away: 'Racing', date: 'Miércoles 21:30', league: 'Liga Argentina' }
  ]

  useEffect(() => {
    const getUser = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
        const response = await fetch(`${apiUrl}/api/me`, {
          credentials: 'include'
        })

        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        } else {
          navigate('/login')
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error)
        navigate('/login')
      }
      setLoading(false)
    }
    getUser()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <div className="text-center sm:text-left">
            <Link to="/dashboard" className="text-2xl sm:text-3xl font-bold text-white hover:text-emerald-400 transition-colors">
              ⚽ La Cascarita
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold text-white mt-4">
              Bolsa Media Semana
            </h1>
            <p className="text-slate-400 mt-2">{matches.length} partidos • Cierre: Miércoles 20:00</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-4 py-2">
              <p className="text-slate-400 text-xs">Saldo</p>
              <p className="text-emerald-400 font-bold text-lg">
                ${user?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">💰 Bolsa Actual</h2>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">$2,850</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-slate-300 text-sm">Participantes</p>
              <p className="text-white font-semibold text-lg">24</p>
            </div>
          </div>
        </div>

        {/* Matches */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">📅 Partidos</h3>
          <div className="space-y-3">
            {matches.map((match) => (
              <div key={match.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className="text-xl sm:text-2xl">⚽</span>
                    <div>
                      <p className="text-white font-semibold text-sm sm:text-base">
                        {match.home} vs {match.away}
                      </p>
                      <p className="text-slate-400 text-xs sm:text-sm">{match.date} • {match.league}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors">
                      Local
                    </button>
                    <button className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors">
                      Empate
                    </button>
                    <button className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors">
                      Visitante
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 px-6 rounded-xl mt-6 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Enviar Quiniela ($10)
          </button>
        </div>

        {/* Back Button */}
        <div className="mt-4 text-center">
          <Link 
            to="/dashboard" 
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default MediaSemana
