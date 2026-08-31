import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

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
    const { username } = req.body

    if (!username) {
      return res.status(400).json({ error: 'El nombre de usuario es requerido' })
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

    // Enviar código de verificación con Twilio Verify
    const client = twilio(twilioAccountSid, twilioAuthToken)
    
    // Formatear número de teléfono para México (agregar +52 si no tiene código de país)
    let phoneNumber = user.phone
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+52${phoneNumber}`
    }

    try {
      const verification = await client.verify.v2
        .services(twilioVerifyServiceSid)
        .verifications
        .create({
          to: phoneNumber,
          channel: 'sms'
        })

      // Ocultar número de teléfono
      const maskedPhone = phoneNumber.replace(/(\+\d{2})(\d{4})(\d{4})/, '$1****$3')

      res.json({
        message: 'Código enviado exitosamente',
        maskedPhone: maskedPhone,
        username: user.username
      })

    } catch (twilioError) {
      console.error('Error al enviar código de Twilio:', twilioError)
      return res.status(500).json({ error: 'Error al enviar código de verificación: ' + twilioError.message })
    }

  } catch (error) {
    console.error('Error en send-verification:', error)
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message })
  }
}
