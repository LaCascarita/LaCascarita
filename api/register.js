import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

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
    console.log('Iniciando registro...')
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    console.log('Supabase URL:', supabaseUrl ? 'Configurada' : 'No configurada')
    console.log('Supabase Key:', supabaseKey ? 'Configurada (longitud: ' + supabaseKey.length + ')' : 'No configurada')
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Variables de entorno de Supabase no configuradas' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)
    const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'default_secret_change_in_production'
    const JWT_EXPIRES_IN = '15m'
    const REFRESH_TOKEN_EXPIRES_IN = '7d'

    const { username, phone, password } = req.body
    console.log('Datos recibidos:', { username, phone })

    // Validaciones
    if (!username || !phone || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' })
    }

    // Verificar si el usuario ya existe (verificar username y phone por separado)
    console.log('Verificando username...')
    const { data: existingUsername, error: usernameError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .limit(1)

    if (usernameError) {
      console.error('Error verificando username:', usernameError)
      return res.status(500).json({ error: 'Error al verificar usuario: ' + usernameError.message })
    }

    if (existingUsername && existingUsername.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' })
    }

    console.log('Verificando phone...')
    const { data: existingPhone, error: phoneError } = await supabase
      .from('users')
      .select('phone')
      .eq('phone', phone)
      .limit(1)

    if (phoneError) {
      console.error('Error verificando phone:', phoneError)
      return res.status(500).json({ error: 'Error al verificar usuario: ' + phoneError.message })
    }

    if (existingPhone && existingPhone.length > 0) {
      return res.status(400).json({ error: 'El teléfono ya está registrado' })
    }

    // Generar user_id único
    const randomNumber = Math.floor(Math.random() * 900000) + 100000
    const userId = `LC-${randomNumber}`
    console.log('User ID generado:', userId)

    // Hashear contraseña
    console.log('Hasheando contraseña...')
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insertar usuario en la base de datos
    console.log('Insertando usuario en base de datos...')
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          username,
          phone,
          user_id: userId,
          password_hash: passwordHash,
          balance: 0.00
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Error insertando usuario:', insertError)
      return res.status(500).json({ error: 'Error al registrar usuario: ' + insertError.message })
    }

    console.log('Usuario insertado exitosamente:', newUser.id)

    // Generar tokens JWT
    const userData = {
      id: newUser.id,
      username: newUser.username,
      user_id: newUser.user_id,
      phone: newUser.phone,
      balance: newUser.balance
    }

    const accessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    const refreshToken = jwt.sign(userData, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })

    // Establecer cookies
    res.setHeader('Set-Cookie', [
      `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${15 * 60}`,
      `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    ])

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userData
    })

  } catch (error) {
    console.error('Error en registro:', error)
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message })
  }
}
