import { useState, useEffect } from 'react'
import { apiFetch } from '../utils/api'

const JornadaLeaderboard = ({ jornadaType }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await apiFetch(`/api/jornada-leaderboard?type=${jornadaType}`)
        if (res.ok) {
          const data = await res.json()
          setLeaderboard(data.leaderboard || [])
        }
      } catch (e) {
        console.error('Error fetching leaderboard:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchLeaderboard()
  }, [jornadaType])

  const openDetail = async (entry) => {
    setSelected(entry)
    setDetailData(null)
    setDetailLoading(true)
    try {
      const res = await apiFetch(`/api/participations/${entry.participation_id}/public`)
      if (res.ok) setDetailData(await res.json())
    } catch (e) {
      console.error('Error fetching quiniela detail:', e)
    } finally {
      setDetailLoading(false)
    }
  }

  const predictionLabel = (prediction) => {
    if (prediction === 'home') return 'L'
    if (prediction === 'draw') return 'E'
    if (prediction === 'away') return 'V'
    return prediction
  }

  const formatMoney = (amount) =>
    `$${Number(amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'

  return (
    <>
      <div className="bg-slate-800/60 backdrop-blur-lg border border-slate-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-white mb-3">🏆 Ranking</h2>
        <div className="max-h-64 overflow-y-auto">
          {loading ? (
            <p className="text-slate-400 text-sm">Cargando...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-slate-400 text-sm">Aún no hay quinielas registradas.</p>
          ) : (
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-slate-400 py-2 pr-2">#</th>
                  <th className="text-left text-slate-400 py-2 pr-2">Usuario</th>
                  <th className="text-left text-slate-400 py-2 pr-2">Aciertos</th>
                  <th className="text-right text-slate-400 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry) => (
                  <tr key={entry.participation_id} className={`border-b border-white/5 ${entry.is_mine ? 'bg-emerald-500/10' : ''}`}>
                    <td className="py-2 pr-2 text-white font-semibold">{entry.position}</td>
                    <td className="py-2 pr-2 text-white">
                      {entry.username}
                      {entry.is_mine && <span className="text-emerald-400 text-xs ml-1">(tú)</span>}
                    </td>
                    <td className="py-2 pr-2 text-emerald-400 font-semibold">{entry.correct}/{entry.total}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => openDetail(entry)}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-md transition-colors"
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
      </div>

      {/* Modal detalle de quiniela ajena */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => { setSelected(null); setDetailData(null) }}
        >
          <div
            className="bg-slate-900 border border-white/20 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">
              Detalle de Quiniela de {selected.username}
            </h3>
            {detailLoading ? (
              <p className="text-slate-400">Cargando detalle...</p>
            ) : detailData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <p className="text-slate-300"><strong className="text-white">Jornada:</strong> {detailData.participation.admin_jornadas?.name || detailData.participation.admin_jornadas?.type}</p>
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
              onClick={() => { setSelected(null); setDetailData(null) }}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default JornadaLeaderboard
