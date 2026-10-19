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
  const [editingMatchId, setEditingMatchId] = useState(null)
  const [editDateTime, setEditDateTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [currentJornada, setCurrentJornada] = useState(null)
  const [dateRange, setDateRange] = useState({ from: '', to: '' })

  const [activeView, setActiveView] = useState('jornada')
  const [participationsType, setParticipationsType] = useState('media_semana')
  const [participationsData, setParticipationsData] = useState(null)
  const [jornadaHistory, setJornadaHistory] = useState([])
  const [selectedJornadaId, setSelectedJornadaId] = useState('')
  const [participationsLoading, setParticipationsLoading] = useState(false)
  const [selectedParticipation, setSelectedParticipation] = useState(null)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [distributing, setDistributing] = useState(false)
  const [distributionResult, setDistributionResult] = useState(null)
  const [withdrawals, setWithdrawals] = useState([])
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)
  const [deposits, setDeposits] = useState([])
  const [depositHistory, setDepositHistory] = useState([])
  const [depositsLoading, setDepositsLoading] = useState(false)
  const [depositActionId, setDepositActionId] = useState(null)
  const [simulatingId, setSimulatingId] = useState(null)
  const [simulateEnabled, setSimulateEnabled] = useState(false)
  const [reconciliation, setReconciliation] = useState(null)
  const [reconLoading, setReconLoading] = useState(false)
  const [earningsRange, setEarningsRange] = useState({ from: '', to: '' })
  const [earningsType, setEarningsType] = useState('')
  const [earningsData, setEarningsData] = useState(null)
  const [earningsLoading, setEarningsLoading] = useState(false)

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

  useEffect(() => {
    if (activeView === 'participaciones') {
      fetchJornadaHistory()
      fetchParticipations()
    }
    if (activeView === 'retiros') {
      fetchWithdrawals()
    }
    if (activeView === 'depositos') {
      fetchDeposits()
    }
    if (activeView === 'saldos') {
      fetchReconciliation()
    }
    if (activeView === 'earnings') {
      fetchEarnings()
    }
  }, [activeView, participationsType])

  const setDefaultDateRange = () => {
    const today = new Date()
    const from = today.toISOString().split('T')[0]
    const to = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    setDateRange({ from, to })
  }

  const adminFetch = async (path, options = {}) => {
    const API_URL = import.meta.env.VITE_API_URL || window.location.origin
    const response = await fetch(`${API_URL}${path}`, { credentials: 'include', ...options })
    if (response.status === 401 || response.status === 403) {
      navigate('/admin-login')
      throw new Error('Sesión de administrador expirada')
    }
    return response
  }

  const fetchLeagues = async () => {
    try {
      const response = await adminFetch('/api/admin/leagues')
      const data = await response.json()
      setLeagues(data.leagues || [])
    } catch (error) {
      console.error('Error fetching leagues:', error)
    }
  }

  const fetchCurrentJornada = async () => {
    try {
      const response = await adminFetch(`/api/admin/get-jornada?type=${jornadaType}`)
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
      const response = await adminFetch(
        `/api/admin/fixtures?league_id=${selectedLeague}&from=${dateRange.from}&to=${dateRange.to}`
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

  const toMxInputValue = (dateString) => {
    const parts = new Date(dateString).toLocaleString('sv-SE', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    })
    return parts.replace(' ', 'T')
  }

  const startEditTime = (match) => {
    setEditingMatchId(match.match_id)
    setEditDateTime(toMxInputValue(match.match_date))
  }

  const saveEditedTime = (match) => {
    if (!editDateTime) return
    const iso = new Date(`${editDateTime}:00-06:00`).toISOString()
    const apply = m => m.match_id === match.match_id ? { ...m, match_date: iso, time_edited: true } : m
    setMatches(matches.map(apply))
    setSelectedMatches(selectedMatches.map(apply))
    setEditingMatchId(null)
  }

  const handleSave = async () => {
    if (selectedMatches.length === 0) {
      setMessage('Selecciona al menos un partido')
      return
    }

    setSaving(true)
    try {
      const response = await adminFetch('/api/admin/save-jornada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const fetchJornadaHistory = async () => {
    try {
      const response = await adminFetch(`/api/admin/jornada-history?type=${participationsType}`)
      const data = await response.json()
      setJornadaHistory(data.jornadas || [])
    } catch (error) {
      console.error('Error fetching jornada history:', error)
    }
  }

  const fetchParticipations = async (jornadaId = selectedJornadaId) => {
    setParticipationsLoading(true)
    setDistributionResult(null)
    try {
      const url = jornadaId
        ? `/api/admin/jornada-participations?jornada_id=${jornadaId}`
        : `/api/admin/jornada-participations?type=${participationsType}`
      const response = await adminFetch(url)
      const data = await response.json()
      setParticipationsData(data)
    } catch (error) {
      console.error('Error fetching participations:', error)
    } finally {
      setParticipationsLoading(false)
    }
  }

  const fetchEarnings = async () => {
    setEarningsLoading(true)
    try {
      const params = new URLSearchParams()
      if (earningsRange.from) params.set('from', earningsRange.from)
      if (earningsRange.to) params.set('to', earningsRange.to)
      if (earningsType) params.set('type', earningsType)
      const response = await adminFetch(`/api/admin/earnings?${params.toString()}`)
      const data = await response.json()
      setEarningsData(data)
    } catch (error) {
      console.error('Error fetching earnings:', error)
    } finally {
      setEarningsLoading(false)
    }
  }

  const exportEarningsCSV = () => {
    if (!earningsData?.rows?.length) return
    const header = 'Jornada,Tipo,Fecha inicio,Quinielas,Participantes,Recaudado,Casa 30%,Premios pagados,Estatus\n'
    const lines = earningsData.rows.map(r =>
      `"${r.name}",${r.type},${r.start_date},${r.quinielas},${r.participantes},${r.collected},${r.house},${r.prizes_paid},${r.status}`
    ).join('\n')
    const t = earningsData.totals
    const totalsLine = `"TOTAL","","",${t.quinielas},"",${t.collected},${t.house},${t.prizes_paid},""`
    const blob = new Blob([header + lines + '\n' + totalsLine], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ganancias_${earningsRange.from || 'inicio'}_a_${earningsRange.to || 'hoy'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleJornadaSelect = (jornadaId) => {
    setSelectedJornadaId(jornadaId)
    fetchParticipations(jornadaId)
  }

  const handleDistributePrizes = async () => {
    if (!window.confirm('¿Cerrar la jornada y repartir los premios? Esta acción acredita saldo a los ganadores.')) return

    setDistributing(true)
    setDistributionResult(null)
    try {
      const response = await adminFetch('/api/admin/distribute-prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: participationsType })
      })
      const data = await response.json()

      if (!response.ok && !data.alreadyDistributed) {
        throw new Error(data.error || 'Error al repartir premios')
      }

      setDistributionResult(data)
      fetchParticipations()
    } catch (error) {
      setDistributionResult({ error: error.message })
    } finally {
      setDistributing(false)
    }
  }

  const handleToggleJornada = async (type, action) => {
    const confirmMsg = action === 'close'
      ? '¿Cerrar la quiniela? Los usuarios ya no podrán enviar pronósticos.'
      : '¿Reabrir la quiniela? Los usuarios podrán volver a participar.'
    if (!window.confirm(confirmMsg)) return

    try {
      const response = await adminFetch('/api/admin/jornada-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al actualizar jornada')
      setMessage(data.message)
      fetchCurrentJornada()
      if (participationsData) fetchParticipations()
    } catch (error) {
      setMessage(error.message)
    }
  }

  const fetchWithdrawals = async () => {
    setWithdrawalsLoading(true)
    try {
      const response = await adminFetch('/api/admin/withdrawals')
      const data = await response.json()
      setWithdrawals(data.withdrawals || [])
      setSimulateEnabled(!!data.simulate_enabled)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setWithdrawalsLoading(false)
    }
  }

  const fetchDeposits = async () => {
    setDepositsLoading(true)
    try {
      const response = await adminFetch('/api/admin/pending-deposits')
      const data = await response.json()
      setDeposits(data.deposits || [])
      setDepositHistory(data.history || [])
    } catch (error) {
      console.error('Error fetching deposits:', error)
    } finally {
      setDepositsLoading(false)
    }
  }

  const handleConfirmDeposit = async (deposit) => {
    if (!window.confirm(`¿Confirmar recarga de $${Number(deposit.amount).toFixed(2)} de ${deposit.users?.username}? Asegúrate de que el abono ya está en el banco.`)) return
    setDepositActionId(deposit.id)
    try {
      const response = await adminFetch('/api/admin/confirm-spei', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: deposit.id })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al confirmar')
      setMessage(data.message)
      fetchDeposits()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setDepositActionId(null)
    }
  }

  const handleRejectDeposit = async (deposit) => {
    if (!window.confirm(`¿Rechazar la recarga de $${Number(deposit.amount).toFixed(2)} de ${deposit.users?.username}?`)) return
    setDepositActionId(deposit.id)
    try {
      const response = await adminFetch('/api/admin/reject-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: deposit.id })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al rechazar')
      setMessage(data.message)
      fetchDeposits()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setDepositActionId(null)
    }
  }

  const handleSimulatePayout = async (withdrawal, result) => {
    setSimulatingId(withdrawal.id)
    try {
      const response = await adminFetch('/api/admin/simulate-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: withdrawal.payment_id, result })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al simular')
      setMessage(data.message)
      fetchWithdrawals()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSimulatingId(null)
    }
  }

  const handleProcessWithdrawal = async (withdrawal) => {
    if (!window.confirm(`¿Dispersar ${formatMoney(withdrawal.amount)} a ${withdrawal.card_holder} (CLABE ****${withdrawal.clabe?.slice(-6)})?`)) return
    setSimulatingId(withdrawal.id)
    try {
      const response = await adminFetch('/api/admin/process-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: withdrawal.id })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al dispersar')
      setMessage(data.message)
      fetchWithdrawals()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSimulatingId(null)
    }
  }

  const handleManualPayout = async (withdrawal, result) => {
    const action = result === 'paid' ? 'marcar como PAGADO (ya hiciste la transferencia en tu banca)' : 'RECHAZAR (se reembolsa el saldo)'
    if (!window.confirm(`¿${action} el retiro de ${formatMoney(withdrawal.amount)} a ${withdrawal.card_holder}?`)) return
    setSimulatingId(withdrawal.id)
    try {
      const response = await adminFetch('/api/admin/manual-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawal_id: withdrawal.id, result })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al procesar')
      setMessage(data.message)
      fetchWithdrawals()
    } catch (error) {
      setMessage(error.message)
    } finally {
      setSimulatingId(null)
    }
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const response = await adminFetch('/api/admin/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setUsersLoading(false)
    }
  }

  const fetchReconciliation = async () => {
    setReconLoading(true)
    try {
      const response = await adminFetch('/api/admin/reconciliation')
      const data = await response.json()
      setReconciliation(data)
    } catch (error) {
      console.error('Error fetching reconciliation:', error)
    } finally {
      setReconLoading(false)
    }
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="admin-brand">
          <img src="/logo_cascarita.svg" alt="La Cascarita" className="admin-brand-logo" />
          <div className="admin-brand-text">
            <span className="admin-brand-name">LA CASCARITA</span>
            <span className="admin-brand-tag">TU QUINIELA DE FUTBOL</span>
          </div>
        </div>
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
          <button
            onClick={() => setActiveView('saldos')}
            className={`admin-tab ${activeView === 'saldos' ? 'active' : ''}`}
          >
            Saldos de Usuarios
          </button>
          <button
            onClick={() => setActiveView('depositos')}
            className={`admin-tab ${activeView === 'depositos' ? 'active' : ''}`}
          >
            Recargas
          </button>
          <button
            onClick={() => setActiveView('retiros')}
            className={`admin-tab ${activeView === 'retiros' ? 'active' : ''}`}
          >
            Retiros (prueba)
          </button>
          <button
            onClick={() => setActiveView('earnings')}
            className={`admin-tab ${activeView === 'earnings' ? 'active' : ''}`}
          >
            Ganancias
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
                      {editingMatchId === match.match_id ? (
                        <span className="edit-time-form" onClick={e => e.stopPropagation()}>
                          <input
                            type="datetime-local"
                            value={editDateTime}
                            onChange={e => setEditDateTime(e.target.value)}
                          />
                          <button type="button" className="edit-time-save" onClick={() => saveEditedTime(match)}>✓</button>
                          <button type="button" className="edit-time-cancel" onClick={() => setEditingMatchId(null)}>×</button>
                        </span>
                      ) : (
                        <>
                          {new Date(match.match_date).toLocaleDateString('es-MX', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            timeZone: 'America/Mexico_City'
                          })}
                          {' '}
                          {new Date(match.match_date).toLocaleTimeString('es-MX', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'America/Mexico_City'
                          })}
                          {match.time_edited && <span className="edited-mark" title="Hora editada manualmente">✏️</span>}
                          <button
                            type="button"
                            className="edit-time-button"
                            title="Editar hora"
                            onClick={e => { e.stopPropagation(); startEditTime(match) }}
                          >
                            ✏️
                          </button>
                        </>
                      )}
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
              <p><strong>Estado:</strong> {currentJornada.status === 'active' ? 'Activa' : 'Cerrada'}</p>
              {currentJornada.status === 'active' ? (
                <button
                  onClick={() => handleToggleJornada(jornadaType, 'close')}
                  className="save-button"
                  style={{ backgroundColor: '#f59e0b' }}
                >
                  🔒 Cerrar Quiniela
                </button>
              ) : (
                <button
                  onClick={() => handleToggleJornada(jornadaType, 'open')}
                  className="action-button"
                >
                  🔓 Reabrir Quiniela
                </button>
              )}
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
                onChange={(e) => { setParticipationsType(e.target.value); setSelectedJornadaId('') }}
                className="form-select"
              >
                {jornadaTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Jornada</label>
              <select
                value={selectedJornadaId}
                onChange={(e) => handleJornadaSelect(e.target.value)}
                className="form-select"
              >
                <option value="">Actual (más reciente)</option>
                {jornadaHistory.slice(selectedJornadaId ? 0 : 1).map(j => (
                  <option key={j.id} value={j.id}>
                    {j.name} — {j.status === 'completed' ? 'Finalizada' : j.status === 'inactive' ? 'Cerrada' : 'Activa'} ({j.participations_count} part. · {formatMoney(j.total_collected)})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchParticipations()}
              className="action-button"
              disabled={participationsLoading}
            >
              {participationsLoading ? 'Cargando...' : 'Cargar Participaciones'}
            </button>

            {message && <div className={`message ${message.includes('rror') ? 'error' : 'success'}`}>{message}</div>}

            {participationsData?.jornada && (() => {
              const collected = participationsData.participations?.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0) || 0
              const uniqueUsers = new Set((participationsData.participations || []).map(p => p.user_id)).size
              const basePool = collected * 0.7
              const isDom = participationsData.jornada.type === 'dominical'
              return (
                <div className="participations-summary">
                  <p><strong>Quinielas:</strong> {participationsData.participations?.length || 0}</p>
                  <p><strong>Participantes:</strong> {uniqueUsers}</p>
                  <p><strong>Total recaudado:</strong> {formatMoney(collected)}</p>
                  <p><strong>Bolsa total de premios:</strong> {formatMoney(basePool + (participationsData.carryover || 0))}</p>
                  <p><strong>Casa (30%):</strong> {formatMoney(collected * 0.3)}</p>
                  {!participationsData.distribution && (
                    <>
                      <p><strong>Premio 1er lugar:</strong> {formatMoney(isDom ? basePool : basePool * 0.8)}</p>
                      {!isDom && (
                        <p><strong>Premio 2do lugar:</strong> {formatMoney(basePool * 0.2 + (participationsData.carryover || 0))}{participationsData.carryover > 0 ? ` (incluye ${formatMoney(participationsData.carryover)} acumulado)` : ''}</p>
                      )}
                    </>
                  )}
                  {participationsData.distribution && (
                    <>
                      <p><strong>1er lugar:</strong> {formatMoney(participationsData.distribution.first_place_pool)}</p>
                      {participationsData.jornada.type !== 'dominical' && (
                        <p><strong>2do lugar:</strong> {participationsData.distribution.second_place_winners > 0
                          ? formatMoney(participationsData.distribution.second_place_pool)
                          : `$0 repartido — ${formatMoney(participationsData.distribution.carryover_out)} acumulados`}</p>
                      )}
                    </>
                  )}
                  <p><strong>Estado:</strong> {participationsData.jornada.status === 'completed' ? 'Finalizada' : participationsData.jornada.status === 'inactive' ? 'Cerrada' : 'Activa'}</p>
                </div>
              )
            })()}

            {participationsData?.jornada && participationsData.jornada.status !== 'completed' && participationsData.jornada.is_latest && (
              <div className="admin-actions" style={{ marginTop: '10px' }}>
                {participationsData.jornada.status === 'active' ? (
                  <button
                    onClick={() => handleToggleJornada(participationsType, 'close')}
                    className="save-button"
                    style={{ backgroundColor: '#f59e0b' }}
                  >
                    🔒 Cerrar Quiniela
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleJornada(participationsType, 'open')}
                    className="action-button"
                  >
                    🔓 Reabrir Quiniela
                  </button>
                )}
                <button
                  onClick={handleDistributePrizes}
                  className="save-button"
                  disabled={distributing}
                >
                  {distributing ? 'Repartiendo...' : 'Cerrar Jornada y Repartir Premios'}
                </button>
              </div>
            )}

            {distributionResult?.error && (
              <div className="message error">{distributionResult.error}</div>
            )}

            {(distributionResult?.distribution || participationsData?.distribution) && (() => {
              const d = distributionResult?.distribution || participationsData?.distribution
              return (
                <div className="participations-summary">
                  <p><strong>Premios repartidos</strong></p>
                  <p><strong>Bolsa total:</strong> {formatMoney(d.prize_pool)}{d.carryover_in > 0 ? ` (incluye ${formatMoney(d.carryover_in)} acumulado)` : ''}</p>
                  <p><strong>1er lugar:</strong> {formatMoney(d.first_place_pool)} — {d.first_place_winners} quiniela{d.first_place_winners !== 1 ? 's' : ''} × {formatMoney(d.first_place_share)}</p>
                  {d.jornada_type !== 'dominical' && (
                    d.second_place_winners > 0 ? (
                      <p><strong>2do lugar:</strong> {formatMoney(d.second_place_pool)} — {d.second_place_winners} quiniela{d.second_place_winners !== 1 ? 's' : ''} × {formatMoney(d.second_place_share)}</p>
                    ) : (
                      <p><strong>2do lugar:</strong> {formatMoney(d.second_place_pool)} sin repartir{d.carryover_out > 0 ? ` — acumulado para la próxima jornada` : ''}</p>
                    )
                  )}
                </div>
              )
            })()}

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
                            {match.home_score != null && match.away_score != null && (
                              <span className="match-score">{match.home_score} - {match.away_score}</span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th>Aciertos</th>
                      <th>Premio</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...participationsData.participations].sort((a, b) => (b.correct_predictions || 0) - (a.correct_predictions || 0)).map((participation) => (
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
                                    <span
                                      key={idx}
                                      className="prediction-badge"
                                      style={{
                                        backgroundColor: 'transparent',
                                        border: pred.is_correct === true ? '2px solid #10b981' : pred.is_correct === false ? '2px solid #ef4444' : '1px solid #64748b',
                                        color: pred.is_correct === true ? '#10b981' : pred.is_correct === false ? '#ef4444' : '#94a3b8'
                                      }}
                                    >
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
                          <strong>{participation.correct_predictions ?? 0}</strong>
                          {participation.position === 1 && ' 🥇'}
                          {participation.position === 2 && ' 🥈'}
                        </td>
                        <td>
                          {parseFloat(participation.prize_amount) > 0
                            ? formatMoney(participation.prize_amount)
                            : '-'}
                        </td>
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

        {activeView === 'saldos' && (
          <div className="admin-section">
            <h2>Saldos de Usuarios</h2>

            {reconLoading && <p className="no-results">Calculando conciliación...</p>}

            {reconciliation && !reconLoading && (
              <div className="recon-card">
                <h3>Conciliación</h3>
                <div className="recon-grid">
                  <div className="recon-item">
                    <span className="recon-label">Saldo total en usuarios (pasivo)</span>
                    <span className="recon-value">{formatMoney(reconciliation.user_balances)}</span>
                  </div>
                  <div className="recon-item">
                    <span className="recon-label">Depósitos cobrados</span>
                    <span className="recon-value">{formatMoney(reconciliation.deposits_paid)}</span>
                  </div>
                  <div className="recon-item">
                    <span className="recon-label">Retiros pagados</span>
                    <span className="recon-value">{formatMoney(reconciliation.withdrawals_paid)}</span>
                  </div>
                  <div className="recon-item recon-highlight">
                    <span className="recon-label">Efectivo esperado en banco/Openpay</span>
                    <span className="recon-value">{formatMoney(reconciliation.expected_cash)}</span>
                  </div>
                  <div className="recon-item">
                    <span className="recon-label">Jugado en quinielas</span>
                    <span className="recon-value">{formatMoney(reconciliation.quiniela_spend)}</span>
                  </div>
                  <div className="recon-item">
                    <span className="recon-label">Premios repartidos</span>
                    <span className="recon-value">{formatMoney(reconciliation.prizes_paid)}</span>
                  </div>
                  <div className="recon-item">
                    <span className="recon-label">Acumulado pendiente (2° lugar)</span>
                    <span className="recon-value">{formatMoney(reconciliation.carryover_pending)}</span>
                  </div>
                  <div className="recon-item recon-highlight">
                    <span className="recon-label">Margen bruto casa (antes de comisiones)</span>
                    <span className="recon-value">{formatMoney(reconciliation.house_margin_gross)}</span>
                  </div>
                  {(reconciliation.deposits_pending > 0 || reconciliation.withdrawals_processing > 0) && (
                    <div className="recon-item recon-note">
                      <span className="recon-label">En tránsito</span>
                      <span className="recon-value">
                        {reconciliation.deposits_pending > 0 && `Depósitos: ${formatMoney(reconciliation.deposits_pending)} `}
                        {reconciliation.withdrawals_processing > 0 && `Retiros: ${formatMoney(reconciliation.withdrawals_processing)}`}
                      </span>
                    </div>
                  )}
                </div>
                <p className="section-hint">
                  "Efectivo esperado" = depósitos cobrados - retiros pagados. Es lo que debería haber
                  entre Openpay y tu banco <strong>antes de comisiones</strong>. Debe ser ≥ al pasivo
                  de usuarios; la diferencia es el margen de la casa.
                </p>
              </div>
            )}

            <button
              onClick={fetchUsers}
              className="action-button"
              disabled={usersLoading}
            >
              {usersLoading ? 'Cargando...' : 'Cargar Usuarios'}
            </button>

            {users.length > 0 && (
              <div className="participations-table-wrapper">
                <table className="participations-table users-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.username}</td>
                        <td>{formatMoney(user.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!usersLoading && users.length === 0 && (
              <p className="no-results">No hay usuarios con saldo registrado.</p>
            )}
          </div>
        )}

        {activeView === 'depositos' && (
          <div className="admin-section">
            <h2>Recargas SPEI pendientes</h2>
            <p className="section-hint">
              Verifica en tu banca que el abono llegó (monto y referencia) antes de confirmar. Los que dicen "avisó" ya presionaron "Ya transferí".
            </p>

            {depositsLoading && <p className="no-results">Cargando recargas...</p>}

            {!depositsLoading && deposits.length === 0 && (
              <p className="no-results">No hay recargas pendientes.</p>
            )}

            {deposits.length > 0 && (
              <div className="participations-table-wrapper">
                <table className="participations-table withdrawals-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Referencia</th>
                      <th>Monto exacto</th>
                      <th>Avisó</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.map((d) => (
                      <tr key={d.id}>
                        <td data-label="Usuario">{d.users?.username || '-'}</td>
                        <td data-label="Referencia"><code>{d.provider_metadata?.spei_reference || '-'}</code></td>
                        <td data-label="Monto exacto">
                          ${Number(d.amount).toFixed(2)}
                        </td>
                        <td data-label="Avisó">
                          {d.provider_metadata?.user_notified
                            ? <span className="status-badge status-paid">avisó</span>
                            : <span className="status-badge">sin aviso</span>}
                        </td>
                        <td data-label="Fecha">{new Date(d.created_at).toLocaleString('es-MX')}</td>
                        <td data-label="Acciones">
                          <button
                            className="action-button simulate-btn"
                            disabled={depositActionId === d.id}
                            onClick={() => handleConfirmDeposit(d)}
                          >
                            {depositActionId === d.id ? '...' : '✓ Confirmar'}
                          </button>
                          {' '}
                          <button
                            className="action-button simulate-btn reject"
                            disabled={depositActionId === d.id}
                            onClick={() => handleRejectDeposit(d)}
                          >
                            {depositActionId === d.id ? '...' : '✗ Rechazar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h2 style={{ marginTop: '2rem' }}>Historial de recargas</h2>

            {depositHistory.length === 0 && !depositsLoading && (
              <p className="no-results">Aún no hay recargas procesadas.</p>
            )}

            {depositHistory.length > 0 && (
              <div className="participations-table-wrapper">
                <table className="participations-table withdrawals-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Referencia</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Solicitada</th>
                      <th>Confirmada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depositHistory.map((d) => (
                      <tr key={d.id}>
                        <td data-label="Usuario">{d.users?.username || '-'}</td>
                        <td data-label="Referencia"><code>{d.provider_metadata?.spei_reference || '-'}</code></td>
                        <td data-label="Monto">${Number(d.amount).toFixed(2)}</td>
                        <td data-label="Estado">
                          <span className={`status-badge ${d.status === 'paid' ? 'status-paid' : 'status-failed'}`}>
                            {d.status === 'paid' ? 'confirmada' : 'rechazada'}
                          </span>
                        </td>
                        <td data-label="Solicitada">{new Date(d.created_at).toLocaleString('es-MX')}</td>
                        <td data-label="Confirmada">{d.paid_at ? new Date(d.paid_at).toLocaleString('es-MX') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeView === 'retiros' && (
          <div className="admin-section">
            <h2>Retiros SPEI</h2>
            <p className="section-hint">
              Los retiros pendientes se dispersan por SPEI desde aquí. Los botones de simulación solo aparecen en retiros simulados (SIMULATE_PAYOUTS activo).
            </p>

            {withdrawalsLoading && <p className="no-results">Cargando retiros...</p>}

            {!withdrawalsLoading && withdrawals.length === 0 && (
              <p className="no-results">No hay retiros registrados.</p>
            )}

            {withdrawals.length > 0 && (
              <div className="participations-table-wrapper">
                <table className="participations-table withdrawals-table">
                  <thead>
                    <tr>
                      <th>Titular</th>
                      <th>CLABE</th>
                      <th>Monto</th>
                      <th>Estado</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w.id}>
                        <td data-label="Titular">{w.card_holder}</td>
                        <td data-label="CLABE">
                          {w.clabe ? (
                            <>
                              <code>{w.clabe}</code>
                              {' '}
                              <button
                                className="action-button simulate-btn"
                                style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                onClick={() => { navigator.clipboard.writeText(w.clabe); setMessage('CLABE copiada') }}
                              >
                                Copiar
                              </button>
                            </>
                          ) : '-'}
                        </td>
                        <td data-label="Monto">{formatMoney(w.amount)}</td>
                        <td data-label="Estado">
                          <span className={`status-badge status-${w.status}`}>{w.status}</span>
                        </td>
                        <td data-label="Fecha">{new Date(w.created_at).toLocaleDateString('es-MX')}</td>
                        <td data-label="Acciones">
                          {w.status === 'pending' && (
                            <>
                              <button
                                className="action-button simulate-btn"
                                disabled={simulatingId === w.id}
                                onClick={() => handleProcessWithdrawal(w)}
                              >
                                {simulatingId === w.id ? '...' : 'Dispersar SPEI'}
                              </button>
                              {' '}
                              <button
                                className="action-button simulate-btn"
                                disabled={simulatingId === w.id}
                                onClick={() => handleManualPayout(w, 'paid')}
                                title="Usar cuando ya hiciste la transferencia manualmente desde tu banca"
                              >
                                {simulatingId === w.id ? '...' : '✓ Pagado manual'}
                              </button>
                              {' '}
                              <button
                                className="action-button simulate-btn reject"
                                disabled={simulatingId === w.id}
                                onClick={() => handleManualPayout(w, 'rejected')}
                              >
                                {simulatingId === w.id ? '...' : '✗ Rechazar'}
                              </button>
                            </>
                          )}
                          {w.status === 'processing' && w.simulated && simulateEnabled && (
                            <>
                              <button
                                className="action-button simulate-btn"
                                disabled={simulatingId === w.id}
                                onClick={() => handleSimulatePayout(w, 'paid')}
                              >
                                {simulatingId === w.id ? '...' : '✓ Pagado'}
                              </button>
                              {' '}
                              <button
                                className="action-button simulate-btn reject"
                                disabled={simulatingId === w.id}
                                onClick={() => handleSimulatePayout(w, 'failed')}
                              >
                                {simulatingId === w.id ? '...' : '✗ Rechazado'}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeView === 'earnings' && (
          <div className="admin-section">
            <h2>Ganancias de la casa</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Desde</label>
                <input
                  type="date"
                  value={earningsRange.from}
                  onChange={(e) => setEarningsRange({ ...earningsRange, from: e.target.value })}
                  className="form-select"
                />
              </div>
              <div className="form-group">
                <label>Hasta</label>
                <input
                  type="date"
                  value={earningsRange.to}
                  onChange={(e) => setEarningsRange({ ...earningsRange, to: e.target.value })}
                  className="form-select"
                />
              </div>
              <div className="form-group">
                <label>Tipo de Jornada</label>
                <select
                  value={earningsType}
                  onChange={(e) => setEarningsType(e.target.value)}
                  className="form-select"
                >
                  <option value="">Todas</option>
                  {jornadaTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={fetchEarnings} className="action-button" disabled={earningsLoading}>
                {earningsLoading ? 'Cargando...' : 'Consultar'}
              </button>
              {earningsData?.rows?.length > 0 && (
                <button onClick={exportEarningsCSV} className="action-button">
                  Exportar CSV
                </button>
              )}
            </div>

            {earningsData && earningsData.rows.length === 0 && (
              <p className="no-results">No hay jornadas en ese rango de fechas.</p>
            )}

            {earningsData?.rows?.length > 0 && (
              <div className="table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Jornada</th>
                      <th>Tipo</th>
                      <th>Inicio</th>
                      <th>Quinielas</th>
                      <th>Participantes</th>
                      <th>Recaudado</th>
                      <th>Casa (30%)</th>
                      <th>Premios pagados</th>
                      <th>Estatus</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsData.rows.map(r => (
                      <tr key={r.jornada_id}>
                        <td data-label="Jornada">{r.name}</td>
                        <td data-label="Tipo">{jornadaTypes.find(t => t.value === r.type)?.label || r.type}</td>
                        <td data-label="Inicio">{r.start_date}</td>
                        <td data-label="Quinielas">{r.quinielas}</td>
                        <td data-label="Participantes">{r.participantes}</td>
                        <td data-label="Recaudado">{formatMoney(r.collected)}</td>
                        <td data-label="Casa">{formatMoney(r.house)}</td>
                        <td data-label="Premios">{formatMoney(r.prizes_paid)}</td>
                        <td data-label="Estatus">{r.status === 'completed' ? 'Finalizada' : r.status === 'inactive' ? 'Cerrada' : 'Activa'}</td>
                      </tr>
                    ))}
                    <tr className="totals-row">
                      <td data-label="Jornada"><strong>TOTAL</strong></td>
                      <td></td>
                      <td></td>
                      <td data-label="Quinielas"><strong>{earningsData.totals.quinielas}</strong></td>
                      <td></td>
                      <td data-label="Recaudado"><strong>{formatMoney(earningsData.totals.collected)}</strong></td>
                      <td data-label="Casa"><strong>{formatMoney(earningsData.totals.house)}</strong></td>
                      <td data-label="Premios"><strong>{formatMoney(earningsData.totals.prizes_paid)}</strong></td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

export default AdminDashboard
