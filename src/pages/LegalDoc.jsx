import { Link } from 'react-router-dom'

// Página genérica para documentos legales (reglamento, términos, aviso de privacidad)
// Props: title, updatedAt, sections = [{ heading, paragraphs: [] }]
const LegalDoc = ({ title, updatedAt, sections }) => {
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link to="/register" className="text-emerald-400 hover:text-emerald-300 text-sm">
          ← Volver
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold mt-6 mb-2">{title}</h1>
        {updatedAt && (
          <p className="text-slate-500 text-sm mb-8">Última actualización: {updatedAt}</p>
        )}

        <div className="space-y-8">
          {sections.map((section, i) => (
            <section key={i}>
              <h2 className="text-lg font-semibold text-emerald-400 mb-3">{section.heading}</h2>
              {section.paragraphs.map((p, j) => (
                <p key={j} className="text-slate-300 text-sm leading-relaxed mb-3">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LegalDoc
