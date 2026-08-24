const NoticeBanner = ({ type = 'info', title, message, icon }) => {
  const typeClasses = {
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    warning: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
  }

  return (
    <div className={`${typeClasses[type]} border rounded-xl p-6`}>
      <div className="flex items-start gap-4">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-slate-300">{message}</p>
        </div>
      </div>
    </div>
  )
}

export default NoticeBanner
