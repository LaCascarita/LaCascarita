const PurchaseSuccessModal = ({ data, onClose }) => {
  if (!data) return null

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(amount || 0)
  }

  const fecha = new Date().toLocaleDateString('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const rows = [
    { label: 'Folio', value: data.folio },
    { label: 'Jornada', value: data.jornadaName },
    { label: 'Fecha', value: fecha },
    { label: 'Quinielas', value: data.totalQuinielas },
    { label: 'Monto total', value: formatCurrency(data.totalAmount) },
    { label: 'Saldo restante', value: formatCurrency(data.newBalance) }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-2 justify-center mb-1">
          <img src="/logo_cascarita.svg" alt="La Cascarita" className="h-8 w-8" />
          <span className="text-white font-bold tracking-widest">LA CASCARITA</span>
        </div>
        <div className="text-center my-4">
          <div className="text-4xl mb-2">✅</div>
          <h2 className="text-xl font-bold text-white">¡Quiniela registrada!</h2>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-4 space-y-2 mb-5">
          {rows.filter(r => r.value != null && r.value !== '').map(r => (
            <div key={r.label} className="flex justify-between items-center text-sm">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-white font-semibold">{r.value}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}

export default PurchaseSuccessModal
