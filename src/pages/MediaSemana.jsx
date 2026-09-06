import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getNextBagDate } from '../utils/bagDates'
import { format } from 'date-fns-tz'

const MediaSemana = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [matches, setMatches] = useState([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [selections, setSelections] = useState({}) // { matchId: ['local', 'empate', etc] }
  const [totalQuinielas, setTotalQuinielas] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)

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

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
        const response = await fetch(`${apiUrl}/api/football/jornada-matches?type=media_semana`)
        
        if (response.ok) {
          const data = await response.json()
          setMatches(Array.isArray(data.matches) ? data.matches : [])
        } else {
          console.error('Error fetching matches:', response.statusText)
        }
      } catch (error) {
        console.error('Error fetching matches:', error)
      } finally {
        setLoadingMatches(false)
      }
    }
    fetchMatches()
  }, [])

  // Calcular total de quinielas y monto (producto de opciones seleccionadas)
  useEffect(() => {
    const matchSelections = Object.values(selections)
    if (matchSelections.length === 0) {
      setTotalQuinielas(0)
      setTotalAmount(0)
      return
    }
    const total = matchSelections.reduce((acc, selections) => acc * selections.length, 1)
    setTotalQuinielas(total)
    setTotalAmount(total * 10)
  }, [selections])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    )
  }

  const formatMatchDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible'
    
    const date = new Date(dateString)
    
    // Obtener fecha original sin conversión de timezone (usando UTC)
    const dayOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'UTC'
    }
    const dayString = date.toLocaleDateString('es-MX', dayOptions)
    
    // Obtener hora convertida a México usando date-fns-tz
    const timeString = format(date, "HH:mm", {
      timeZone: 'America/Mexico_City'
    })
    
    return `${dayString} • ${timeString}`
  }

  const getLeagueName = (match) => {
    return match.league_name || 'Liga'
  }

  const getMatchResult = (match) => {
    // Verificar si el partido ya terminó
    if (match.match_status === 'FT' || match.match_status === 'AET' || match.match_status === 'PEN') {
      const homeScore = parseInt(match.home_score) || 0
      const awayScore = parseInt(match.away_score) || 0
      
      if (homeScore > awayScore) {
        return { winner: 'home', status: 'finished', homeScore, awayScore }
      } else if (awayScore > homeScore) {
        return { winner: 'away', status: 'finished', homeScore, awayScore }
      } else {
        return { winner: 'draw', status: 'finished', homeScore, awayScore }
      }
    }
    return { winner: null, status: 'upcoming' }
  }

  const handleSelection = (matchId, option) => {
    setSelections(prev => {
      const currentSelections = prev[matchId] || []
      let newSelections
      
      if (currentSelections.includes(option)) {
        // Deseleccionar si ya está seleccionado
        newSelections = currentSelections.filter(s => s !== option)
      } else {
        // Agregar selección
        newSelections = [...currentSelections, option]
      }
      
      // Si no hay selecciones para este partido, eliminar la entrada
      if (newSelections.length === 0) {
        const { [matchId]: removed, ...rest } = prev
        return rest
      }
      
      return {
        ...prev,
        [matchId]: newSelections
      }
    })
  }

  const isSelected = (matchId, option) => {
    return selections[matchId]?.includes(option) || false
  }

  const allMatchesSelected = matches.length > 0 && matches.every(match => selections[match.match_id]?.length > 0)

  const handleSubmit = () => {
    if (!allMatchesSelected) {
      alert(`Debes seleccionar al menos un resultado en cada uno de los ${matches.length} partidos.`)
      return
    }
    if (totalQuinielas < 2) {
      alert('Mínimo de participación: 2 quinielas ($20 MXN). Selecciona al menos un doble.')
      return
    }
    // Aquí iría la lógica para enviar la quiniela al backend
    console.log('Enviando quiniela:', selections)
    alert(`Quiniela enviada: ${totalQuinielas} quinielas por $${totalAmount} MXN`)
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

        {/* Selection Counter */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">🎯 Tu Selección</h2>
              <p className="text-2xl sm:text-3xl font-bold text-blue-400">{totalQuinielas} Quinielas</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-slate-300 text-sm">Total</p>
              <p className="text-white font-semibold text-lg">${totalAmount} MXN</p>
            </div>
          </div>
        </div>

        {/* Matches */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">📅 Partidos</h3>
          
          {loadingMatches ? (
            <div className="text-center text-slate-400 py-8">Cargando partidos...</div>
          ) : matches.length === 0 ? (
            <div className="text-center text-slate-400 py-8">No hay partidos disponibles para esta fecha</div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => (
                <div key={match.match_id} className={`bg-white/5 rounded-lg p-4 border ${getMatchResult(match).status === 'finished' ? 'border-yellow-500/30' : 'border-white/10'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="text-xl sm:text-2xl">⚽</span>
                      <div className="flex items-center gap-2">
                        {match.home_team_badge && (
                          <img 
                            src={match.home_team_badge} 
                            alt={match.home_team_name}
                            className={`w-8 h-8 sm:w-10 sm:h-10 object-contain ${getMatchResult(match).winner === 'home' ? 'ring-2 ring-emerald-400 rounded-full' : getMatchResult(match).winner === 'away' ? 'opacity-50' : ''}`}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div>
                          <p className={`font-semibold text-sm sm:text-base ${getMatchResult(match).winner === 'home' ? 'text-emerald-400' : getMatchResult(match).winner === 'away' ? 'text-red-400' : getMatchResult(match).winner === 'draw' ? 'text-yellow-400' : 'text-white'}`}>
                            {match.home_team_name} vs {match.away_team_name}
                          </p>
                          <p className="text-slate-400 text-xs sm:text-sm">
                            {getLeagueName(match)} • {formatMatchDate(match.match_date)}
                            {getMatchResult(match).status === 'finished' && (
                              <span className="ml-2 text-yellow-400">• {match.home_score} - {match.away_score}</span>
                            )}
                          </p>
                        </div>
                        {match.away_team_badge && (
                          <img 
                            src={match.away_team_badge} 
                            alt={match.away_team_name}
                            className={`w-8 h-8 sm:w-10 sm:h-10 object-contain ${getMatchResult(match).winner === 'away' ? 'ring-2 ring-emerald-400 rounded-full' : getMatchResult(match).winner === 'home' ? 'opacity-50' : ''}`}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      {getMatchResult(match).status === 'finished' ? (
                        <div className="flex items-center gap-2 px-3 py-2">
                          {getMatchResult(match).winner === 'home' && <span className="text-emerald-400 text-sm font-semibold">🏆 Local</span>}
                          {getMatchResult(match).winner === 'away' && <span className="text-emerald-400 text-sm font-semibold">🏆 Visitante</span>}
                          {getMatchResult(match).winner === 'draw' && <span className="text-yellow-400 text-sm font-semibold">🤝 Empate</span>}
                        </div>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleSelection(match.match_id, 'local')}
                            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                              isSelected(match.match_id, 'local') 
                                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' 
                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            Local
                          </button>
                          <button 
                            onClick={() => handleSelection(match.match_id, 'empate')}
                            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                              isSelected(match.match_id, 'empate') 
                                ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            Empate
                          </button>
                          <button 
                            onClick={() => handleSelection(match.match_id, 'visitante')}
                            className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${
                              isSelected(match.match_id, 'visitante') 
                                ? 'bg-purple-600 text-white ring-2 ring-purple-400' 
                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                            }`}
                          >
                            Visitante
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={!allMatchesSelected || totalQuinielas < 2}
            className={`w-full font-semibold py-4 px-6 rounded-xl mt-6 transition-all duration-300 transform hover:scale-105 shadow-lg ${
              !allMatchesSelected || totalQuinielas < 2
                ? 'bg-slate-500 text-slate-300 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            Enviar Quiniela (${totalAmount} MXN)
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
