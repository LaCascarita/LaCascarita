import { useState } from 'react'

const WalletSection = ({ balance, transactions, participations, walletLoading, onDeposit, onWithdraw, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('deposit')
  const [depositAmount, setDepositAmount] = useState('')
  const [depositMethod, setDepositMethod] = useState('mercadopago')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawForm, setWithdrawForm] = useState({
    bank_name: '',
    account_number: '',
    clabe: '',
    card_holder: ''
  })

  const handleDepositSubmit = (e) => {
    e.preventDefault()
    if (!depositAmount || parseFloat(depositAmount) <= 0) return
    onDeposit({ amount: parseFloat(depositAmount), method: depositMethod })
  }

  const handleWithdrawSubmit = (e) => {
    e.preventDefault()
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return
    onWithdraw({ amount: parseFloat(withdrawAmount), ...withdrawForm })
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

  const tabs = [
    { id: 'deposit', label: 'Recargar' },
    { id: 'withdraw', label: 'Retirar' },
    { id: 'history', label: 'Movimientos' },
    { id: 'participations', label: 'Participaciones' }
  ]

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
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDepositMethod('mercadopago')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  depositMethod === 'mercadopago'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                Mercado Pago
              </button>
              <button
                type="button"
                onClick={() => setDepositMethod('spei')}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  depositMethod === 'spei'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                SPEI
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Monto a recargar (MXN)</label>
            <input
              type="number"
              min="10"
              step="1"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="100"
              required
            />
          </div>

          {depositMethod === 'spei' && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-white/10">
              <p className="text-slate-300 text-sm mb-2">Instrucciones SPEI:</p>
              <ul className="text-slate-400 text-xs space-y-1 list-disc list-inside">
                <li>Realiza tu transferencia desde tu banca en línea.</li>
                <li>Usa la referencia que se generará al solicitar.</li>
                <li>Tu recarga será acreditada en cuanto sea confirmada.</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={walletLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-all"
          >
            {walletLoading ? 'Procesando...' : depositMethod === 'mercadopago' ? 'Pagar con Mercado Pago' : 'Generar referencia SPEI'}
          </button>
        </form>
      )}

      {activeTab === 'withdraw' && (
        <form onSubmit={handleWithdrawSubmit} className="space-y-4 max-w-md">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Monto a retirar (MXN)</label>
            <input
              type="number"
              min="50"
              step="1"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="500"
              required
            />
            <p className="text-slate-500 text-xs mt-1">Mínimo $50. Disponible: ${balance.toFixed(2)}</p>
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
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Banco</label>
            <input
              type="text"
              value={withdrawForm.bank_name}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="BBVA, Santander, etc."
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">Número de cuenta</label>
            <input
              type="text"
              value={withdrawForm.account_number}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="Número de cuenta"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm mb-2">CLABE (18 dígitos)</label>
            <input
              type="text"
              minLength="18"
              maxLength="18"
              value={withdrawForm.clabe}
              onChange={(e) => setWithdrawForm({ ...withdrawForm, clabe: e.target.value })}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="000000000000000000"
            />
          </div>

          <button
            type="submit"
            disabled={walletLoading || parseFloat(withdrawAmount) > balance}
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
                  <th className="text-left text-slate-400 pb-3 px-2">Monto</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Estado</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Premio</th>
                  <th className="text-left text-slate-400 pb-3 px-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {participations.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-3 px-2">{p.folio}</td>
                    <td className="py-3 px-2">${parseFloat(p.payment_amount || 0).toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        p.participation_status === 'confirmed'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : p.participation_status === 'pending'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}>
                        {p.participation_status}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      {parseFloat(p.prize_amount || 0) > 0 ? (
                        <span className="text-emerald-400">+${parseFloat(p.prize_amount).toFixed(2)}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-2">{formatDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default WalletSection
