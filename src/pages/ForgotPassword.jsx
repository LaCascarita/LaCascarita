import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1: username, 2: verify code, 3: new password
  const [formData, setFormData] = useState({
    username: '',
    code: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [userPhone, setUserPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  const handleStep1 = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido')
      return
    }

    setLoading(true)

    try {
      // Llamar al backend para enviar código de verificación
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${apiUrl}/api/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al buscar usuario')
        setLoading(false)
        return
      }

      setUserPhone(data.maskedPhone)
      setSuccess(`Código enviado al número ${data.maskedPhone}`)
      setStep(2)
      setLoading(false)

    } catch (error) {
      setError('Error al conectar con el servidor. Intente nuevamente.')
      setLoading(false)
    }
  }

  const handleStep2 = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.code.trim()) {
      setError('El código es requerido')
      return
    }

    setLoading(true)

    try {
      setSuccess('Código verificado correctamente')
      setStep(3)
      setLoading(false)

    } catch (error) {
      setError('Error al verificar código. Intente nuevamente.')
      setLoading(false)
    }
  }

  const handleStep3 = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.newPassword) {
      setError('La nueva contraseña es requerida')
      return
    }
    if (formData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)

    try {
      // Llamar al backend para verificar código y cambiar contraseña
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${apiUrl}/api/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          code: formData.code,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al cambiar contraseña')
        setLoading(false)
        return
      }

      setSuccess('¡Contraseña cambiada exitosamente!')
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (error) {
      setError('Error al conectar con el servidor. Intente nuevamente.')
      setLoading(false)
    }
  }

  const resendCode = async () => {
    setLoading(true)
    setError('')
    
    try {
      // Llamar al backend para reenviar código
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${apiUrl}/api/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al reenviar código')
        setLoading(false)
        return
      }

      setSuccess(`Nuevo código enviado al número ${data.maskedPhone}`)
      setLoading(false)
    } catch (error) {
      setError('Error al conectar con el servidor. Intente nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/login" className="text-4xl font-bold text-white hover:text-emerald-400 transition-colors">
            ⚽ La Cascarita
          </Link>
          <h2 className="text-2xl font-semibold text-white mt-4">
            Recuperar Contraseña
          </h2>
          <p className="text-slate-400 mt-2">
            {step === 1 && 'Ingresa tu usuario para buscar tu cuenta'}
            {step === 2 && 'Ingresa el código que enviamos a tu teléfono'}
            {step === 3 && 'Establece tu nueva contraseña'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 1 ? 'bg-emerald-500 text-white' : 'bg-white/20 text-slate-400'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${
              step >= 2 ? 'bg-emerald-500' : 'bg-white/20'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 2 ? 'bg-emerald-500 text-white' : 'bg-white/20 text-slate-400'
            }`}>
              2
            </div>
            <div className={`w-12 h-1 ${
              step >= 3 ? 'bg-emerald-500' : 'bg-white/20'
            }`}></div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step >= 3 ? 'bg-emerald-500 text-white' : 'bg-white/20 text-slate-400'
            }`}>
              3
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-4 mb-6">
              <p className="text-emerald-300 text-sm">{success}</p>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Tu nombre de usuario"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {loading ? 'Buscando...' : 'Buscar Usuario'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-6">
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-slate-400 text-sm mb-1">Número de teléfono:</p>
                <p className="text-white font-semibold">{userPhone}</p>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Código de verificación
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  maxLength={6}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
                  placeholder="000000"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <button
                type="button"
                onClick={resendCode}
                disabled={loading}
                className="w-full bg-transparent hover:bg-white/10 text-slate-400 hover:text-white font-medium py-3 px-6 rounded-xl transition-all border border-white/20"
              >
                Reenviar código
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Mínimo 6 caracteres"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Repite tu contraseña"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                {loading ? 'Cambiar Contraseña...' : 'Cambiar Contraseña'}
              </button>
            </form>
          )}
        </div>

        {/* Back to Login */}
        <div className="mt-4 text-center">
          <Link 
            to="/login" 
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
