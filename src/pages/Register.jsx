import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { generateUserId } from '../lib/supabase'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [generatedId, setGeneratedId] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido')
      return false
    }
    if (formData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres')
      return false
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('El nombre de usuario solo puede contener letras, números y guiones bajos')
      return false
    }
    if (!formData.phone.trim()) {
      setError('El número de teléfono es requerido')
      return false
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError('El número de teléfono debe tener 10 dígitos')
      return false
    }
    if (!formData.password) {
      setError('La contraseña es requerida')
      return false
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return false
    }
    if (!formData.acceptTerms) {
      setError('Debes aceptar el reglamento para continuar')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Llamar al backend para registrar
      const response = await fetch('http://localhost:3001/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          username: formData.username,
          phone: formData.phone,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Error al registrar usuario')
        return
      }

      setGeneratedId(data.user.user_id)
      setSuccess(true)

      // Redirigir después de 3 segundos
      setTimeout(() => {
        navigate('/dashboard')
      }, 3000)

    } catch (error) {
      setError('Error al conectar con el servidor. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border_white/20 text-center">
            <div className="text-5xl sm:text-6xl mb-4">✅</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              ¡Registro Exitoso!
            </h2>
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 sm:p-6 mb-4">
              <p className="text-slate-300 mb-2">Tu ID de usuario es:</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{generatedId}</p>
            </div>
            <p className="text-slate-300 mb-2">
              Usuario: <span className="text-white font-semibold">{formData.username}</span>
            </p>
            <p className="text-slate-400 text-sm mb-6">
              Recuerda: Este usuario no podrá cambiarse posteriormente
            </p>
            <p className="text-slate-400 text-sm">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl sm:text-4xl font-bold text-white hover:text-emerald-400 transition-colors">
            ⚽ La Cascarita
          </Link>
          <h2 className="text-xl sm:text-2xl font-semibold text-white mt-4">
            Crear Cuenta
          </h2>
          <p className="text-slate-400 mt-2">
            Únete y comienza a ganar
          </p>
        </div>

        {/* Register Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 sm:p-8 border border-white/20">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-white font-medium mb-2">
                Usuario *
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
              <p className="text-slate-400 text-xs mt-2">
                Solo letras, números y guiones bajos. No se podrá cambiar después.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-white font-medium mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="10 dígitos"
                maxLength={10}
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-medium mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Mínimo 6 caracteres"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-white font-medium mb-2">
                Confirmar Contraseña *
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

            {/* Terms Acceptance */}
            <div className="flex items-start">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 w-5 h-5"
                disabled={loading}
              />
              <label className="ml-3 text-slate-300 text-sm">
                Acepto el reglamento de La Cascarita y los términos y condiciones del servicio
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link 
            to="/" 
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register