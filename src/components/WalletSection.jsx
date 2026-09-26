import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const CLABE_BANKS = {
  '002': 'Banamex', '012': 'BBVA', '014': 'Santander', '021': 'HSBC',
  '030': 'Banco del Bajío', '032': 'IXE', '036': 'Inbursa', '042': 'Mifel',
  '044': 'Scotiabank', '058': 'Banregio', '059': 'Invex', '060': 'Bansi',
  '062': 'Afirme', '072': 'Banorte', '127': 'Azteca', '128': 'Autofin',
  '130': 'Compartamos', '132': 'Multiva', '133': 'Actinver', '136': 'Inter Banco',
  '137': 'BanCoppel', '140': 'Consubanco', '143': 'CIBanco', '147': 'Bankaool',
  '150': 'BIM', '152': 'Bancrea', '166': 'Bansefi', '646': 'STP',
  '677': 'Nu Mexico', '722': 'Mercado Pago', '728': 'Hey Banco', '638': 'Akala',
  '652': 'Klar', '659': 'Nu Bank', '710': 'Ualá', '138': 'ABC Capital',
  '151': 'Dondé', '106': 'Bank of America', '129': 'Barclays', '638': 'Akala'
}

const WalletSection = ({ balance, transactions, participations, walletLoading, onDeposit, onWithdraw, onRefresh, defaultTab = 'deposit' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawForm, setWithdrawForm] = useState({
    clabe: '',
    clabe_confirm: '',
    card_holder: ''
  })
  const detectedBank = CLABE_BANKS[withdrawForm.clabe.slice(0, 3)] || null
  const clabeMismatch = withdrawForm.clabe_confirm.length > 0 && withdrawForm.clabe !== withdrawForm.clabe_confirm
  const [selectedParticipation, setSelectedParticipation] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const handleDepositSubmit = (e) => {
    e.preventDefault()
    if (!depositAmount || parseFloat(depositAmount) < 100) return
    onDeposit({ amount: parseFloat(depositAmount), method: 'spei' })
  }

  const handleWithdrawSubmit = (e) => {
    e.preventDefault()
    if (!withdrawAmount || parseFloat(withdrawAmount) < 200) return
    if (withdrawForm.clabe !== withdrawForm.clabe_confirm) return
    const { clabe_confirm, ...form } = withdrawForm
    onWithdraw({ amount: parseFloat(withdrawAmount), ...form, bank_name: detectedBank || '' })
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeLabel = (type) => {
    const labels = {
      deposit: 'Recarga',
      bet: 'Apuesta',
      prize: 'Premio',
      withdrawal: 'Retiro',
      refund: 'Reembolso',
      adjustment: 'Ajuste'
    }
    return labels[type] || type
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pendiente',
      completed: 'Completado',
      paid: 'Pagado',
      failed: 'Fallido',
      cancelled: 'Cancelado'
    }
    return labels[status] || status
  }

  const getJornadaName = (type) => {
    const names = {
      media_semana: 'Media Semana',
      fin_de_semana: 'Fin de Semana',
      dominical: 'Dominical'
    }
    return names[type] || type
  }

  const formatMoney = (amount) => {
    return '$' + parseFloat(amount || 0).toFixed(2)
  }

  const predictionLabel = (prediction) => {
    if (prediction === 'home') return 'L'
    if (prediction === 'draw') return 'E'
    if (prediction === 'away') return 'V'
    return prediction
  }

  const tabs = [
    { id: 'deposit', label: 'Recargar' },
    { id: 'withdraw', label: 'Retirar' },
    { id: 'history', label: 'Movimientos' },
    { id: 'participations', label: 'Participaciones' }
  ]

  useEffect(() => {
    if (!selectedParticipation) return
    setDetailLoading(true)
    const fetchDetail = async () => {
      try {
        const response = await apiFetch(`/api/participations/${selectedParticipation.id}`)
        if (response.ok) {
          const data = await response.json()
          setDetailData(data)
        }
      } catch (error) {
        console.error('Error al cargar detalle:', error)
      } finally {
        setDetailLoading(false)
      }
    }
    fetchDetail()
  }, [selectedParticipation])

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-white">💰 Mi Billetera</h3>
          <p className="text-slate-400 text-sm">Gestiona tu saldo, recargas, retiros e historial.</p>
        </div>
        <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg px-4 py-2">
          <p className="text-slate-400 text-xs">Saldo Disponible</p>
          <p className="text-emerald-400 font-bold text-lg">${balance.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (tab.id === 'history' || tab.id === 'participations') onRefresh()
            }}
            className={`px-4 py-2 rounded-lg transition-all text-sm ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'deposit' && (
        <form onSubmit={handleDepositSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Método de recarga</label>
            <div className="px-4 py-2 rounded-lg text-sm bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 w-fit">
              SPEI (transferencia bancaria)
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Monto a recargar (MXN)</label>
            <input
              type="number"
              min="100"
              step="1"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="100"
              required
            />
            <p className="text-slate-500 text-xs mt-1">Mínimo $100.</p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg px-4 py-3">
            <p className="text-yellow-400 text-xs font-semibold">
              ⚠️ Asegúrate de transferir la misma cantidad que escribas en "Monto a recargar"
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
            <p className="text-slate-300 text-sm mb-2">Instrucciones SPEI:</p>
            <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside">
              <li>Realiza tu transferencia desde tu banca en línea.</li>
              <li>Usa la CLABE única que se generará al solicitar.</li>
              <li>Tu recarga se acreditará automáticamente al recibir el pago.</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={walletLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-all"
          >
            {walletLoading ? 'Procesando...' : 'Generar referencia SPEI'}
          </button>
        </form>
      )}

      {activeTab === 'withdraw' && (
        <form onSubmit={handleWithdrawSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Monto a retirar (MXN)</label>
            <input
              type="number"
              min="200"
              step="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="200"
              required
            />
            <p className="text-slate-500 text-xs mt-1">Mínimo $200. Disponible: ${balance.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Titular de la cuenta</label>
            <input
              type="text"
              value={withdrawForm.card_holder}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, card_holder: e.target.value })}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="Nombre completo"
              required
            />
            <p className="text-slate-500 text-xs mt-1">Escríbelo como aparece en tu cuenta bancaria.</p>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">CLABE (18 dígitos)</label>
            <input
              type="text"
              inputMode="numeric"
              minLength="18"
              maxLength="18"
              value={withdrawForm.clabe}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, clabe: e.target.value.replace(/\D/g, '') })}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="000000000000000000"
              required
            />
            {withdrawForm.clabe.length >= 3 && (
              <p className={`text-xs mt-1 ${detectedBank ? 'text-emerald-400' : 'text-slate-500'}`}>
                {detectedBank ? `Banco: ${detectedBank}` : 'Banco no identificado'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Confirma tu CLABE</label>
            <input
              type="text"
              inputMode="numeric"
              minLength="18"
              maxLength="18"
              value={withdrawForm.clabe_confirm}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, clabe_confirm: e.target.value.replace(/\D/g, '') })}
              className={`w-full bg-white/5 border rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none ${
                clabeMismatch ? 'border-red-500 focus:border-red-500' : 'border-white/20 focus:border-emerald-500'
              }`}
              placeholder="Repite los 18 dígitos"
              required
            />
            {clabeMismatch && (
              <p className="text-red-400 text-xs mt-1">Las CLABE no coinciden, verifícala.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={walletLoading || parseFloat(withdrawAmount) > balance || clabeMismatch}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-all"
          >
            {walletLoading ? 'Procesando...' : 'Solicitar retiro'}
          </button>
        </form>
      )}

      {activeTab === 'history' && (
        <div className="overflow-x-auto">
          {walletLoading ? (
            <p className="text-slate-400">Cargando...</p>
          ) : transactions.length === 0 ? (
            <p className="text-slate-400">No hay movimientos aún.</p>
          ) : (
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-slate-400 pb-3 px-2">Fecha</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Concepto</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Monto</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Saldo después</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Estado</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5">
                    <td className="py-3 px-2">{formatDate(tx.created_at)}</td>
                    <td className="py-3 px-2">{getTypeLabel(tx.type)}</td>
                    <td className={`py-3 px-2 font-semibold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount >= 0 ? '+' : ''}${parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-2">${parseFloat(tx.balance_after).toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tx.status === 'completed' || tx.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : tx.status === 'pending'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'participations' && (
        <div className="overflow-x-auto">
          {walletLoading ? (
            <p className="text-slate-400">Cargando...</p>
          ) : participations.length === 0 ? (
            <p className="text-slate-400">Aún no has participado en ninguna quiniela.</p>
          ) : (
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-slate-400 pb-3 px-2">Folio</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Tipo</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Fecha</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Aciertos</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Premio</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {participations.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-3 px-2">{p.folio}</td>
                    <td className="py-3 px-2">{getJornadaName(p.admin_jornadas?.type)}</td>
                    <td className="py-3 px-2">{formatDate(p.created_at)}</td>
                    <td className="py-3 px-2">{p.correct_predictions || 0}/{p.predictions_count || 0}</td>
                    <td className="py-3 px-2">
                      {parseFloat(p.prize_amount || 0) > 0 ? (
                        <span className="text-emerald-400 font-semibold">+${parseFloat(p.prize_amount).toFixed(2)}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => setSelectedParticipation(p)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded transition-colors"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedParticipation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => {
            setSelectedParticipation(null)
            setDetailData(null)
          }}
        >
          <div
            className="bg-slate-900 border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Detalle de Quiniela</h3>
            {detailLoading ? (
              <p className="text-slate-400">Cargando detalle...</p>
            ) : detailData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <p className="text-slate-300"><strong className="text-white">Folio:</strong> {detailData.participation.folio}</p>
                  <p className="text-slate-300"><strong className="text-white">Jornada:</strong> {detailData.participation.admin_jornadas?.name || getJornadaName(detailData.participation.admin_jornadas?.type)}</p>
                  <p className="text-slate-300"><strong className="text-white">Fecha:</strong> {formatDate(detailData.participation.created_at)}</p>
                  <p className="text-slate-300"><strong className="text-white">Monto:</strong> {formatMoney(detailData.participation.payment_amount)}</p>
                  <p className="text-slate-300"><strong className="text-white">Aciertos:</strong> {detailData.participation.correct_predictions || 0}/{detailData.participation.predictions_count || 0}</p>
                  <p className="text-slate-300"><strong className="text-white">Premio:</strong> {parseFloat(detailData.participation.prize_amount || 0) > 0 ? formatMoney(detailData.participation.prize_amount) : '-'}</p>
                </div>

                <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-slate-400 py-2 px-3">Partido</th>
                        <th className="text-left text-slate-400 py-2 px-3">Resultado</th>
                        <th className="text-left text-slate-400 py-2 px-3">Predicción</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      {detailData.matches.map((match) => {
                        const matchPredictions = detailData.predictions.filter(pred => pred.match_id === match.id)
                        const hasResult = match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined
                        const matchResult = hasResult
                          ? (match.home_score === match.away_score ? 'draw' : match.home_score > match.away_score ? 'home' : 'away')
                          : null
                        return (
                          <tr key={match.id} className="border-b border-white/5">
                            <td className="py-2 px-3">
                              <span className="font-semibold">{match.home_team_name}</span>
                              <span className="text-slate-400 mx-1">vs</span>
                              <span className="font-semibold">{match.away_team_name}</span>
                              <p className="text-slate-400 text-xs">{match.match_date ? new Date(match.match_date).toLocaleString('es-MX') : '-'}</p>
                            </td>
                            <td className="py-2 px-3">
                              {hasResult ? (
                                <div>
                                  <div className="text-white font-semibold">{match.home_score} - {match.away_score}</div>
                                  <div className="text-emerald-400 text-xs font-medium">Ganador: {predictionLabel(matchResult)}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              {matchPredictions.length > 0 ? (
                                <span className="inline-flex gap-1 flex-wrap">
                                  {matchPredictions.map((pred, idx) => (
                                    <span key={idx} className={`px-2 py-0.5 rounded text-xs border-2 ${
                                      pred.is_correct === true
                                        ? 'border-emerald-500 text-emerald-400'
                                        : hasResult
                                          ? 'border-red-500 text-red-400'
                                          : 'border-slate-500 text-slate-400'
                                    }`}>
                                      {predictionLabel(pred.prediction)}
                                    </span>
                                  ))}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">No se pudo cargar el detalle.</p>
            )}
            <button
              onClick={() => {
                setSelectedParticipation(null)
                setDetailData(null)
              }}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletSection
