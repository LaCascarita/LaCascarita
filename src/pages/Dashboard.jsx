import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardCard from '../components/DashboardCard'
import StatCard from '../components/StatCard'
import NoticeBanner from '../components/NoticeBanner'
import WalletSection from '../components/WalletSection'

const Dashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('overview')
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [participations, setParticipations] = useState([])
  const [walletLoading, setWalletLoading] = useState(false)

  // Datos de ejemplo (se conectarán con Supabase después)
  const userStats = {
    participations: 12,
    prizes: '$2,450',
    ranking: 5,
    accuracy: '68%',
    activeQuinielas: 3
  }

  const currentBags = {
    mediaSemana: '$8,500',
    finDeSemana: '$12,300',
    dominical: '$5,200'
  }

  const upcomingMatches = [
    { id: 1, home: 'América', away: 'Monterrey', date: 'Sábado 16:00', type: 'Fin de Semana' },
    { id: 2, home: 'Chivas', away: 'Pumas', date: 'Sábado 18:00', type: 'Fin de Semana' },
    { id: 3, home: 'Tigres', away: 'Santos', date: 'Domingo 12:00', type: 'Dominical' },
  ]

  const notices = [
    {
      type: 'success',
      title: '¡Nueva Jornada Disponible!',
      message: 'La quiniela de Fin de Semana ya está abierta. Fecha de cierre: Viernes 20:00',
      icon: '🎉'
    },
    {
      type: 'info',
      title: 'Acumulado Actual',
      message: 'El acumulado de la semana es de $25,000. ¡Participa para ganar!',
      icon: '💰'
    }
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
          setBalance(data.user.balance || 0)
          fetchBalanceData()
        } else {
          // Si no está autenticado, redirigir al login
          navigate('/login')
        }
      } catch (error) {
        console.error('Error al obtener usuario:', error)
        navigate('/login')
      }
      setLoading(false)
    }

    const fetchBalanceData = async () => {
      try {
        setWalletLoading(true)
        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
        const response = await fetch(`${apiUrl}/api/balance`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setBalance(data.balance)
          setTransactions(data.transactions || [])
          setParticipations(data.participations || [])
        }
      } catch (error) {
        console.error('Error al cargar saldo:', error)
      } finally {
        setWalletLoading(false)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      await fetch(`${apiUrl}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Error al hacer logout:', error)
    }
    navigate('/')
  }

  const handleDeposit = async ({ amount, method }) => {
    try {
      setWalletLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const endpoint = method === 'mercadopago' ? '/api/payments/deposit' : '/api/payments/spei-request'
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al crear pago')

      if (method === 'mercadopago' && data.init_point) {
        window.location.href = data.init_point
      } else {
        alert(`Referencia SPEI: ${data.external_reference}\nBanco: ${data.bank_name}\nCuenta: ${data.account_number}\nCLABE: ${data.clabe}\nBeneficiario: ${data.beneficiary}`)
      }
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setWalletLoading(false)
    }
  }

  const handleWithdraw = async ({ amount, bank_name, account_number, clabe, card_holder }) => {
    try {
      setWalletLoading(true)
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${apiUrl}/api/withdrawals`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bank_name, account_number, clabe, card_holder })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Error al solicitar retiro')
      alert('Solicitud de retiro creada. Se procesará en cuanto sea revisada.')
      refreshBalance()
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setWalletLoading(false)
    }
  }

  const refreshBalance = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${apiUrl}/api/balance`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
        setTransactions(data.transactions || [])
        setParticipations(data.participations || [])
      }
    } catch (error) {
      console.error('Error al actualizar saldo:', error)
    }
  }

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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">⚽ La Cascarita</h1>
            <p className="text-slate-400 mt-1">Panel Principal</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            {/* Saldo del Usuario */}
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-4 py-2 w-full sm:w-auto">
              <p className="text-slate-400 text-xs">Saldo Disponible</p>
              <p className="text-emerald-400 font-bold text-lg">
                ${balance.toFixed(2)}
              </p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-white font-semibold">{user?.username}</p>
              <p className="text-slate-400 text-sm">{user?.user_id}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition-all border border-red-500/30 w-full sm:w-auto"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          {[
            { id: 'overview', label: 'Resumen' },
            { id: 'wallet', label: 'Recargar / Retirar' },
            { id: 'history', label: 'Historial' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`px-4 py-2 rounded-lg transition-all text-sm sm:text-base ${
                activeSection === tab.id
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bolsas Actuales - Movido al inicio */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20 mb-6 sm:mb-8">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">💰 Bolsas Actuales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/media-semana" className="bg-emerald-500/20 hover:bg-emerald-500/30 rounded-lg p-4 border border-emerald-500/30 transition-all cursor-pointer">
              <p className="text-slate-400 text-sm mb-1">Media Semana</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400">{currentBags.mediaSemana}</p>
              <p className="text-slate-400 text-xs mt-2">9 partidos</p>
            </Link>
            <Link to="/fin-de-semana" className="bg-blue-500/20 hover:bg-blue-500/30 rounded-lg p-4 border border-blue-500/30 transition-all cursor-pointer">
              <p className="text-slate-400 text-sm mb-1">Fin de Semana</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-400">{currentBags.finDeSemana}</p>
              <p className="text-slate-400 text-xs mt-2">9 partidos Liga MX</p>
            </Link>
            <Link to="/dominical" className="bg-purple-500/20 hover:bg-purple-500/30 rounded-lg p-4 border border-purple-500/30 sm:col-span-2 lg:col-span-1 transition-all cursor-pointer">
              <p className="text-slate-400 text-sm mb-1">Dominical</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-400">{currentBags.dominical}</p>
              <p className="text-slate-400 text-xs mt-2">7 partidos</p>
            </Link>
          </div>
        </div>

        {/* Anuncios Importantes */}
        <div className="space-y-4 mb-8">
          {notices.map((notice, index) => (
            <NoticeBanner
              key={index}
              type={notice.type}
              title={notice.title}
              message={notice.message}
              icon={notice.icon}
            />
          ))}
        </div>

        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <DashboardCard
                title="Mis Participaciones"
                value={userStats.participations}
                subtitle="Quinielas jugadas"
                icon="🎯"
                color="emerald"
                onClick={() => setActiveSection('participations')}
              />
              <DashboardCard
                title="Mis Premios"
                value={userStats.prizes}
                subtitle="Ganancias totales"
                icon="🏆"
                color="orange"
                onClick={() => setActiveSection('prizes')}
              />
              <DashboardCard
                title="Mi Ranking"
                value={`#${userStats.ranking}`}
                subtitle="Posición actual"
                icon="📊"
                color="blue"
                onClick={() => setActiveSection('ranking')}
              />
              <DashboardCard
                title="Mi Precisión"
                value={userStats.accuracy}
                subtitle="Aciertos promedio"
                icon="🎯"
                color="purple"
                onClick={() => setActiveSection('stats')}
              />
              <DashboardCard
                title="Quinielas Activas"
                value={userStats.activeQuinielas}
                subtitle="Jornadas disponibles"
                icon="⚽"
                color="emerald"
                onClick={() => setActiveSection('quinielas')}
              />
              <DashboardCard
                title="Historial"
                value="Ver todo"
                subtitle="Tu historial completo"
                icon="📋"
                color="red"
                onClick={() => setActiveSection('history')}
              />
            </div>

            {/* Próximas Jornadas */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">📅 Próximas Jornadas</h3>
              <div className="space-y-3">
                {upcomingMatches.map((match) => (
                  <div key={match.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white/5 rounded-lg p-4 border border-white/10 gap-3">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <span className="text-xl sm:text-2xl">⚽</span>
                      <div>
                        <p className="text-white font-semibold text-sm sm:text-base">
                          {match.home} vs {match.away}
                        </p>
                        <p className="text-slate-400 text-xs sm:text-sm">{match.date}</p>
                      </div>
                    </div>
                    <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs sm:text-sm self-start sm:self-auto">
                      {match.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeSection === 'participations' && (
          <WalletSection
            defaultTab="participations"
            balance={balance}
            transactions={transactions}
            participations={participations}
            walletLoading={walletLoading}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onRefresh={refreshBalance}
          />
        )}

        {activeSection === 'prizes' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">🏆 Mis Premios</h3>
            <p className="text-slate-400 mb-6">Historial de tus ganancias y estado de pagos.</p>
            
            <div className="space-y-4">
              <div className="bg-emerald-500/20 rounded-lg p-4 border border-emerald-500/30">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">1° Lugar - Jornada 12</p>
                    <p className="text-slate-400 text-xs sm:text-sm">Folio: LC-FS-001254</p>
                  </div>
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm self-start sm:self-auto">
                    Pagado
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-emerald-400">$4,250</p>
              </div>
              
              <div className="bg-orange-500/20 rounded-lg p-4 border border-orange-500/30">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                  <div>
                    <p className="text-white font-semibold text-sm sm:text-base">2° Lugar - Jornada 10</p>
                    <p className="text-slate-400 text-xs sm:text-sm">Folio: LC-FS-001180</p>
                  </div>
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm self-start sm:self-auto">
                    Pendiente
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-bold text-orange-400">$1,060</p>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'ranking' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">📊 Mi Ranking</h3>
            <p className="text-slate-400 mb-6">Tu posición en el ranking general de La Cascarita.</p>
            
            <div className="bg-emerald-500/20 rounded-lg p-4 sm:p-6 border border-emerald-500/30 mb-6">
              <p className="text-slate-400 mb-2">Tu posición actual</p>
              <p className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">#5</p>
              <p className="text-slate-300">TigreRegio</p>
            </div>

            <h4 className="text-base sm:text-lg font-semibold text-white mb-4">Ranking General</h4>
            <div className="space-y-3">
              {[
                { pos: 1, user: 'FutboleroMX', points: 156 },
                { pos: 2, user: 'ChivaLoka', points: 148 },
                { pos: 3, user: 'RayadoMX', points: 142 },
                { pos: 4, user: 'AmericaFan', points: 138 },
                { pos: 5, user: 'TigreRegio', points: 135, isYou: true },
              ].map((item) => (
                <div 
                  key={item.pos} 
                  className={`flex items-center justify-between bg-white/5 rounded-lg p-3 sm:p-4 border ${
                    item.isYou ? 'border-emerald-500/50' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <span className={`text-lg sm:text-xl font-bold ${
                      item.pos === 1 ? 'text-yellow-400' :
                      item.pos === 2 ? 'text-slate-300' :
                      item.pos === 3 ? 'text-orange-400' :
                      'text-slate-400'
                    }`}>
                      {item.pos}
                    </span>
                    <span className="text-white font-semibold text-sm sm:text-base">{item.user}</span>
                    {item.isYou && <span className="bg-emerald-500 text-white px-2 py-1 rounded text-xs">Tú</span>}
                  </div>
                  <span className="text-slate-400 text-xs sm:text-sm">{item.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'stats' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">📈 Mis Estadísticas</h3>
            <p className="text-slate-400 mb-6">Análisis detallado de tu rendimiento en las quinielas.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Participaciones Totales"
                value="12"
                subtitle="Quinielas jugadas"
                icon="🎯"
              />
              <StatCard
                title="Precisión Global"
                value="68%"
                subtitle="Aciertos promedio"
                icon="🎯"
                trend={5}
              />
              <StatCard
                title="Mejor Racha"
                value="8"
                subtitle="Aciertos consecutivos"
                icon="🔥"
              />
              <StatCard
                title="Quinielas Ganadas"
                value="3"
                subtitle="Premios obtenidos"
                icon="🏆"
                trend={12}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-3 text-sm sm:text-base">Distribución de Pronósticos</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Local</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 bg-white/10 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="text-white text-xs sm:text-sm">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Empate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 bg-white/10 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                      <span className="text-white text-xs sm:text-sm">25%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Visitante</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 sm:w-32 bg-white/10 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <span className="text-white text-xs sm:text-sm">30%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h4 className="text-white font-semibold mb-3 text-sm sm:text-base">Rendimiento por Tipo</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Media Semana</span>
                    <span className="text-emerald-400 font-semibold text-xs sm:text-sm">72%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Fin de Semana</span>
                    <span className="text-blue-400 font-semibold text-xs sm:text-sm">65%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-xs sm:text-sm">Dominical</span>
                    <span className="text-purple-400 font-semibold text-xs sm:text-sm">70%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'quinielas' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">⚽ Quinielas Activas</h3>
            <p className="text-slate-400 mb-6">Selecciona una quiniela para participar.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-xl p-4 sm:p-6 border border-emerald-500/30 cursor-pointer hover:scale-105 transition-all">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Media Semana</h4>
                <p className="text-slate-400 text-xs sm:text-sm mb-4">9 partidos</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Bolsa:</span>
                    <span className="text-emerald-400 font-semibold">{currentBags.mediaSemana}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Participantes:</span>
                    <span className="text-white">24</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Cierre:</span>
                    <span className="text-white">Miércoles 20:00</span>
                  </div>
                </div>
                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-lg transition-all text-sm sm:text-base">
                  Participar
                </button>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-4 sm:p-6 border border-blue-500/30 cursor-pointer hover:scale-105 transition-all">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Fin de Semana</h4>
                <p className="text-slate-400 text-xs sm:text-sm mb-4">9 partidos Liga MX</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Bolsa:</span>
                    <span className="text-blue-400 font-semibold">{currentBags.finDeSemana}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Participantes:</span>
                    <span className="text-white">38</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Cierre:</span>
                    <span className="text-white">Viernes 20:00</span>
                  </div>
                </div>
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-lg transition-all text-sm sm:text-base">
                  Participar
                </button>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-4 sm:p-6 border border-purple-500/30 cursor-pointer hover:scale-105 transition-all sm:col-span-2 lg:col-span-1">
                <h4 className="text-base sm:text-lg font-semibold text-white mb-2">Dominical</h4>
                <p className="text-slate-400 text-xs sm:text-sm mb-4">7 partidos</p>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Bolsa:</span>
                    <span className="text-purple-400 font-semibold">{currentBags.dominical}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Participantes:</span>
                    <span className="text-white">18</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-400">Cierre:</span>
                    <span className="text-white">Sábado 20:00</span>
                  </div>
                </div>
                <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 rounded-lg transition-all text-sm sm:text-base">
                  Participar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'wallet' && (
          <WalletSection
            balance={balance}
            transactions={transactions}
            participations={participations}
            walletLoading={walletLoading}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onRefresh={refreshBalance}
          />
        )}

        {activeSection === 'history' && (
          <WalletSection
            defaultTab="participations"
            balance={balance}
            transactions={transactions}
            participations={participations}
            walletLoading={walletLoading}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onRefresh={refreshBalance}
          />
        )}
      </div>
    </div>
  )
}

export default Dashboard