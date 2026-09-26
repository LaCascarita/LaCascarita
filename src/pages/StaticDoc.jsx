import { Link } from 'react-router-dom'

// Página genérica para documentos estáticos (privacidad, juego responsable, FAQ)
const StaticDoc = ({ title }) => {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link to="/dashboard" className="text-emerald-400 hover:text-emerald-300 text-sm">
          ← Volver
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mt-6 mb-8">{title}</h1>

        <p className="text-slate-400 text-sm leading-relaxed">
          Documento en preparación. El contenido oficial de esta sección estará disponible
          próximamente.
        </p>
      </div>
    </div>
  )
}

export default StaticDoc
