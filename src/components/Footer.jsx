import { useState } from 'react'

const Footer = () => {
  const [open, setOpen] = useState(false)

  const links = [
    { label: 'Política de privacidad', to: '/privacidad.pdf', external: true },
    { label: 'Términos y Condiciones', to: '/terminos.pdf', external: true },
    { label: 'Reglamento oficial', to: '/reglamento.pdf', external: true },
    { label: 'Política de Juego Responsable', to: '/juego-responsable.pdf', external: true },
    { label: 'Preguntas Frecuentes (FAQ)', to: '/faq.pdf', external: true }
  ]

  return (
    <footer className="border-t border-white/10 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center">
        <button
          onClick={() => setOpen(!open)}
          className="text-slate-300 hover:text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors"
        >
          Legales y Transparencia
          <span className={`text-xs transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
        </button>

        {open && (
          <nav className="mt-3 flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-y-2 gap-x-6">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.to}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-emerald-400 text-sm transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        <p className="text-slate-500 text-xs leading-relaxed mt-6 max-w-2xl mx-auto">
          La Cascarita es una plataforma digital de pronósticos deportivos. Prohibida la venta y
          participación a menores de 18 años. Juega de manera responsable.
        </p>
      </div>
    </footer>
  )
}

export default Footer
