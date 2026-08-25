import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'default_secret_change_in_production'
const JWT_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

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
    const { username, phone, password } = req.body

    // Validaciones
    if (!username || !phone || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' })
    }

    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username, phone')
      .or(`username.eq.${username},phone.eq.${phone}`)
      .limit(1)

    if (checkError) {
      return res.status(500).json({ error: 'Error al verificar usuario' })
    }

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: 'El usuario o teléfono ya está registrado' })
    }

    // Generar user_id único
    const randomNumber = Math.floor(Math.random() * 900000) + 100000
    const userId = `LC-${randomNumber}`

    // Hashear contraseña
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // Insertar usuario en la base de datos
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
      return res.status(500).json({ error: 'Error al registrar usuario: ' + insertError.message })
    }

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
