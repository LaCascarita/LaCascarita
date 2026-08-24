import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Dominical = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/me', {
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

  const matches = [
    { id: 1, home: 'Tigres', away: 'América', date: 'Sábado 20:00' },
    { id: 2, home: 'Chivas', away: 'Cruz Azul', date: 'Sábado 22:00' },
    { id: 3, home: 'Monterrey', away: 'Pumas', date: 'Domingo 12:00' },
    { id: 4, home: 'Rayados', away: 'Santos', date: 'Domingo 14:00' },
    { id: 5, home: 'León', away: 'Puebla', date: 'Domingo 16:00' },
    { id: 6, home: 'Querétaro', away: 'Toluca', date: 'Domingo 18:00' },
    { id: 7, home: 'Necaxa', away: 'Atlas', date: 'Domingo 20:00' },
  ]

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
              Bolsa Dominical
            </h1>
            <p className="text-slate-400 mt-2">7 partidos • Cierre: Sábado 20:00</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg px-4 py-2">
              <p className="text-slate-400 text-xs">Saldo</p>
              <p className="text-purple-400 font-bold text-lg">
                ${user?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">💰 Bolsa Actual</h2>
              <p className="text-2xl sm:text-3xl font-bold text-purple-400">$1,420</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-slate-300 text-sm">Participantes</p>
              <p className="text-white font-semibold text-lg">18</p>
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
                      <p className="text-slate-400 text-xs sm:text-sm">{match.date}</p>
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
          <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 px-6 rounded-xl mt-6 transition-all duration-300 transform hover:scale-105 shadow-lg">
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

export default Dominical
