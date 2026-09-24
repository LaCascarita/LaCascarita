const DashboardCard = ({ title, value, subtitle, icon, onClick }) => {
  return (
    <div
      className="bg-slate-800/60 hover:bg-slate-700/60 border-slate-700 backdrop-blur-lg rounded-xl p-6 border cursor-pointer hover:scale-105 transition-all duration-300"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-emerald-400 mb-1">{value}</p>
      <p className="text-slate-400 text-sm">{subtitle}</p>
    </div>
  )
}

export default DashboardCard
