import { Link } from 'react-router-dom'

const Welcome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl w-full text-center">
        {/* Logo/Brand */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-2">
            ⚽ La Cascarita
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300">
            Tu plataforma de quinielas profesional
          </p>
        </div>

        {/* Welcome Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 md:p-10 mb-8 md:mb-12 border border-white/20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4">
            ¡Bienvenido!
          </h2>
          <p className="text-slate-300 text-base sm:text-lg md:text-xl mb-6 md:mb-8">
            Únete a la comunidad de quinielas más emocionante. Participa en las 
            jornadas de Liga MX, compite con otros jugadores y gana premios increíbles.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
              <div className="text-3xl sm:text-4xl mb-2">🏆</div>
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Premios</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Gana dinero real en cada jornada</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
              <div className="text-3xl sm:text-4xl mb-2">📊</div>
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Rankings</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Compite en tiempo real</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 sm:col-span-2 lg:col-span-1">
              <div className="text-3xl sm:text-4xl mb-2">⚡</div>
              <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Fácil</h3>
              <p className="text-slate-400 text-xs sm:text-sm">Todo desde tu dispositivo</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/register"
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 shadow-lg text-center"
          >
            Registrarse Ahora
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-semibold py-3 sm:py-4 px-6 sm:px-8 rounded-xl border border-white/30 transition-all duration-300 text-center"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-8 md:mt-12 text-slate-400 text-sm">
          <p>¿Ya tienes cuenta? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors">Inicia sesión aquí</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Welcome