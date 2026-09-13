import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="text-9xl mb-6 animate-bounce drop-shadow-2xl" aria-hidden="true">
        ⚽
      </div>
      <h1 className="text-5xl sm:text-7xl font-bold text-white mb-2 text-center">404</h1>
      <h2 className="text-xl sm:text-2xl text-slate-300 mb-4 text-center">
        ¡Gol al poste! Página no encontrada
      </h2>
      <p className="text-slate-400 mb-8 text-center max-w-md">
        Parece que te pasaste del área. La página que buscas no existe o fue movida.
      </p>
      <Link
        to="/"
        className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-8 py-3 rounded-lg transition-all"
      >
        Volver al inicio
      </Link>
    </div>
  )
}

export default NotFound
