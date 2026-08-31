import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

export default async function handler(req, res) {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { username, code, newPassword } = req.body

    if (!username || !code || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    // Verificar credenciales de Twilio
    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      console.error('Credenciales de Twilio no configuradas')
      return res.status(500).json({ error: 'Error de configuración del servidor' })
    }

    // Buscar usuario por username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone, username')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Verificar código con Twilio Verify
    const client = twilio(twilioAccountSid, twilioAuthToken)
    
    // Formatear número de teléfono para México (agregar +52 si no tiene código de país)
    let phoneNumber = user.phone
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+52${phoneNumber}`
    }

    try {
      const verificationCheck = await client.verify.v2
        .services(twilioVerifyServiceSid)
        .verificationChecks
        .create({
          to: phoneNumber,
          code: code
        })

      if (verificationCheck.status !== 'approved') {
        return res.status(400).json({ error: 'Código inválido o expirado' })
      }

      // Hashear nueva contraseña
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(newPassword, saltRounds)

      // Actualizar contraseña en Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('username', username)

      if (updateError) {
        console.error('Error al actualizar contraseña:', updateError)
        return res.status(500).json({ error: 'Error al actualizar contraseña' })
      }

      res.json({
        message: 'Contraseña actualizada exitosamente'
      })

    } catch (twilioError) {
      console.error('Error al verificar código de Twilio:', twilioError)
      return res.status(500).json({ error: 'Error al verificar código: ' + twilioError.message })
    }

  } catch (error) {
    console.error('Error en verify-code:', error)
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message })
  }
}
