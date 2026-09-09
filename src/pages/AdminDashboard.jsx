import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [jornadaType, setJornadaType] = useState('media_semana')
  const [leagues, setLeagues] = useState([])
  const [selectedLeague, setSelectedLeague] = useState(null)
  const [matches, setMatches] = useState([])
  const [selectedMatches, setSelectedMatches] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [currentJornada, setCurrentJornada] = useState(null)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const [activeView, setActiveView] = useState('jornada')
  const [participationsType, setParticipationsType] = useState('media_semana')
  const [participationsData, setParticipationsData] = useState(null)
  const [participationsLoading, setParticipationsLoading] = useState(false)
  const [selectedParticipation, setSelectedParticipation] = useState(null)

  useEffect(() => {
    fetchLeagues()
    fetchCurrentJornada()
    setDefaultDateRange()
  }, [])

  useEffect(() => {
    if (jornadaType) {
      fetchCurrentJornada()
    }
  }, [jornadaType])

  const setDefaultDateRange = () => {
    const today = new Date()
    const from = today.toISOString().split('T')[0]
    const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    setDateRange({ from, to })
  }

  const fetchLeagues = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${API_URL}/api/admin/leagues`)
      const data = await response.json()
      setLeagues(data.leagues || [])
    } catch (error) {
      console.error('Error fetching leagues:', error)
    }
  }

  const fetchCurrentJornada = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${API_URL}/api/admin/get-jornada?type=${jornadaType}`)
      const data = await response.json()
      if (data.jornada) {
        setCurrentJornada(data.jornada)
        setSelectedMatches(data.matches || [])
      } else {
        setCurrentJornada(null)
        setSelectedMatches([])
      }
    } catch (error) {
      console.error('Error fetching jornada:', error)
    }
  }

  const fetchMatches = async () => {
    if (!selectedLeague || !dateRange.from || !dateRange.to) return

    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(
        `${API_URL}/api/admin/fixtures?league_id=${selectedLeague}&from=${dateRange.from}&to=${dateRange.to}`
      )
      const data = await response.json()
      setMatches(data.matches || [])
    } catch (error) {
      console.error('Error fetching matches:', error)
      setMessage('Error al cargar partidos')
    } finally {
      setLoading(false)
    }
  }

  const toggleMatch = (match) => {
    if (selectedMatches.find(m => m.match_id === match.match_id)) {
      setSelectedMatches(selectedMatches.filter(m => m.match_id !== match.match_id))
    } else {
      if (selectedMatches.length >= 9) {
        setMessage('Máximo 9 partidos permitidos')
        return
      }
      setSelectedMatches([...selectedMatches, match])
    }
    setMessage('')
  }

  const handleSave = async () => {
    if (selectedMatches.length === 0) {
      setMessage('Selecciona al menos un partido')
      return
    }

    setSaving(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${API_URL}/api/admin/save-jornada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: jornadaType,
          name: `${jornadaType.replace('_', ' ').toUpperCase()} - ${new Date().toLocaleDateString()}`,
          start_date: dateRange.from,
          end_date: dateRange.to,
          matches: selectedMatches
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar')
      }

      setMessage('Jornada guardada exitosamente')
      fetchCurrentJornada()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    navigate('/admin-login')
  }

  const jornadaTypes = [
    { value: 'media_semana', label: 'Media Semana' },
    { value: 'fin_de_semana', label: 'Fin de Semana' },
    { value: 'dominical', label: 'Domingo' }
  ]

  const predictionLabel = (prediction) => {
    if (prediction === 'home') return 'L'
    if (prediction === 'draw') return 'E'
    if (prediction === 'away') return 'V'
    return prediction
  }

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const fetchParticipations = async () => {
    setParticipationsLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(
        `${API_URL}/api/admin/jornada-participations?type=${participationsType}`
      )
      const data = await response.json()
      setParticipationsData(data)
    } catch (error) {
      console.error('Error fetching participations:', error)
    } finally {
      setParticipationsLoading(false)
    }
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Panel de Administrador</h1>
        <button onClick={handleLogout} className="logout-button">Cerrar Sesión</button>
      </header>

      <div className="admin-content">
        <div className="admin-tabs">
          <button
            onClick={() => setActiveView('jornada')}
            className={`admin-tab ${activeView === 'jornada' ? 'active' : ''}`}
          >
            Configurar Jornada
          </button>
          <button
            onClick={() => setActiveView('participaciones')}
            className={`admin-tab ${activeView === 'participaciones' ? 'active' : ''}`}
          >
            Ver Participaciones
          </button>
        </div>

        {activeView === 'jornada' && (
          <>
            <div className="admin-section">
              <h2>Configurar Jornada</h2>
          
          <div className="form-group">
            <label>Tipo de Jornada</label>
            <select 
              value={jornadaType} 
              onChange={(e) => setJornadaType(e.target.value)}
              className="form-select"
            >
              {jornadaTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Desde</label>
              <input 
                type="date" 
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <input 
                type="date" 
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Liga</label>
            <select 
              value={selectedLeague || ''} 
              onChange={(e) => setSelectedLeague(parseInt(e.target.value))}
              className="form-select"
            >
              <option value="">Selecciona una liga</option>
              {leagues.map(league => (
                <option key={league.league_id} value={league.league_id}>
                  {league.league_name}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={fetchMatches} 
            className="action-button"
            disabled={!selectedLeague || loading}
          >
            {loading ? 'Cargando...' : 'Cargar Partidos'}
          </button>
        </div>

        {matches.length > 0 && (
          <div className="admin-section">
            <h2>Partidos Disponibles</h2>
            <div className="matches-list">
              {matches.map((match, index) => (
                <div 
                  key={`${match.match_id}-${index}`}
                  className={`match-card ${selectedMatches.find(m => m.match_id === match.match_id) ? 'selected' : ''}`}
                  onClick={() => toggleMatch(match)}
                >
                  <div className="match-info">
                    <div className="match-date">
                      {new Date(match.match_date).toLocaleDateString('es-ES', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                      {' '}
                      {new Date(match.match_date).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="match-teams">
                      <div className="team">
                        {match.home_team_badge && (
                          <img src={match.home_team_badge} alt="" className="team-badge" />
                        )}
                        <span>{match.home_team_name}</span>
                      </div>
                      <span className="vs">vs</span>
                      <div className="team">
                        {match.away_team_badge && (
                          <img src={match.away_team_badge} alt="" className="team-badge" />
                        )}
                        <span>{match.away_team_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="match-checkbox">
                    <input 
                      type="checkbox" 
                      checked={selectedMatches.find(m => m.match_id === match.match_id)}
                      onChange={() => {}}
                      readOnly
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedMatches.length > 0 && (
          <div className="admin-section">
            <h2>Partidos Seleccionados ({selectedMatches.length}/9)</h2>
            <div className="selected-matches">
              {selectedMatches.map((match, index) => (
                <div key={`${match.match_id}-${index}`} className="selected-match">
                  <span>{index + 1}. {match.home_team_name} vs {match.away_team_name}</span>
                  <button 
                    onClick={() => toggleMatch(match)}
                    className="remove-button"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentJornada && (
          <div className="admin-section">
            <h2>Jornada Actual</h2>
            <div className="current-jornada">
              <p><strong>Nombre:</strong> {currentJornada.name}</p>
              <p><strong>Fecha:</strong> {currentJornada.start_date} - {currentJornada.end_date}</p>
              <p><strong>Partidos:</strong> {selectedMatches.length}</p>
            </div>
          </div>
        )}

        <div className="admin-actions">
          {message && <div className={`message ${message.includes('exitosamente') ? 'success' : 'error'}`}>{message}</div>}
          <button 
            onClick={handleSave} 
            className="save-button"
            disabled={selectedMatches.length === 0 || saving}
          >
            {saving ? 'Guardando...' : 'Guardar Jornada'}
          </button>
        </div>
        </>)}

        {activeView === 'participaciones' && (
          <div className="admin-section">
            <h2>Participaciones - {jornadaTypes.find(t => t.value === participationsType)?.label}</h2>

            <div className="form-group">
              <label>Tipo de Jornada</label>
              <select
                value={participationsType}
                onChange={(e) => setParticipationsType(e.target.value)}
                className="form-select"
              >
                {jornadaTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <button
              onClick={fetchParticipations}
              className="action-button"
              disabled={participationsLoading}
            >
              {participationsLoading ? 'Cargando...' : 'Cargar Participaciones'}
            </button>

            {participationsData && (
              <div className="participations-summary">
                <p><strong>Participantes:</strong> {participationsData.participations?.length || 0}</p>
                <p><strong>Total recaudado:</strong> {formatMoney(participationsData.participations?.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0))}</p>
                <p><strong>Bolsa de premios (70%):</strong> {formatMoney(participationsData.participations?.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0) * 0.7)}</p>
                <p><strong>Casa (30%):</strong> {formatMoney(participationsData.participations?.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0) * 0.3)}</p>
              </div>
            )}

            {participationsData?.participations?.length > 0 && (
              <div className="participations-table-wrapper">
                <table className="participations-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      {participationsData.matches.map((match) => (
                        <th key={match.id}>
                          <div className="match-column">
                            <span>{match.home_team_name}</span>
                            <span className="vs-small">vs</span>
                            <span>{match.away_team_name}</span>
                          </div>
                        </th>
                      ))}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participationsData.participations.map((participation) => (
                      <tr key={participation.id}>
                        <td>
                          <div className="user-cell">
                            <strong>{participation.users?.username || participation.user_id}</strong>
                            <span className="folio">{participation.folio}</span>
                          </div>
                        </td>
                        {participationsData.matches.map((match) => {
                          const matchPredictions = participation.predictions.filter(pred => pred.match_id === match.id)
                          return (
                            <td key={match.id}>
                              {matchPredictions.length > 0 ? (
                                <div className="predictions-cell">
                                  {matchPredictions.map((pred, idx) => (
                                    <span key={idx} className="prediction-badge">
                                      {predictionLabel(pred.prediction)}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="no-prediction">-</span>
                              )}
                            </td>
                          )
                        })}
                        <td>
                          <button
                            onClick={() => setSelectedParticipation(participation)}
                            className="view-button"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {participationsData && participationsData.participations?.length === 0 && (
              <p className="no-results">No hay participaciones para esta jornada.</p>
            )}

            {selectedParticipation && (
              <div className="modal-overlay" onClick={() => setSelectedParticipation(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Detalle de Quiniela</h3>
                  <p><strong>Usuario:</strong> {selectedParticipation.users?.username || selectedParticipation.user_id}</p>
                  <p><strong>Folio:</strong> {selectedParticipation.folio}</p>
                  <p><strong>Monto:</strong> {formatMoney(selectedParticipation.payment_amount)}</p>
                  <p><strong>Fecha:</strong> {new Date(selectedParticipation.created_at).toLocaleString('es-MX')}</p>
                  <div className="modal-predictions">
                    {participationsData.matches.map((match) => {
                      const matchPredictions = selectedParticipation.predictions.filter(pred => pred.match_id === match.id)
                      return (
                        <div key={match.id} className="modal-prediction-row">
                          <span className="modal-match">{match.home_team_name} vs {match.away_team_name}</span>
                          <span className="modal-choices">
                            {matchPredictions.length > 0
                              ? matchPredictions.map(pred => predictionLabel(pred.prediction)).join(' / ')
                              : '-'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setSelectedParticipation(null)}
                    className="close-button"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
