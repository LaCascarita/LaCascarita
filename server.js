import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Configuración de Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Configuración JWT
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production'
const JWT_EXPIRES_IN = '15m'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://cascarita-production.up.railway.app', 'https://quiet-praline-798045.netlify.app', 'https://joyful-lokum-18b54b.netlify.app', 'https://la-cascarita.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const token = req.cookies.access_token

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' })
    }
    req.user = user
    next()
  })
}

// Endpoint de registro
app.post('/api/register', async (req, res) => {
  try {
    console.log('📝 Intento de registro:', req.body)
    const { username, phone, password } = req.body

    // Validaciones
    if (!username || !phone || !password) {
      console.log('❌ Validación fallida: campos faltantes')
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    if (!/^\d{10}$/.test(phone)) {
      console.log('❌ Validación fallida: teléfono inválido')
      return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' })
    }

    console.log('✅ Validaciones pasadas')

    // Verificar si el usuario ya existe
    console.log('🔍 Verificando si usuario existe...')
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username, phone')
      .or(`username.eq.${username},phone.eq.${phone}`)
      .limit(1)

    if (checkError) {
      console.log('❌ Error al verificar usuario:', checkError)
      return res.status(500).json({ error: 'Error al verificar usuario' })
    }

    if (existingUser && existingUser.length > 0) {
      console.log('❌ Usuario ya existe')
      return res.status(400).json({ error: 'El usuario o teléfono ya está registrado' })
    }

    console.log('✅ Usuario no existe, procediendo con registro')

    // Generar user_id único
    const randomNumber = Math.floor(Math.random() * 900000) + 100000
    const userId = `LC-${randomNumber}`
    console.log('🆔 User ID generado:', userId)

    // Hashear contraseña
    console.log('🔐 Hasheando contraseña...')
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)
    console.log('✅ Contraseña hasheada')

    // Insertar usuario en la base de datos
    console.log('💾 Insertando usuario en base de datos...')
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
      console.log('❌ Error al insertar usuario:', insertError)
      return res.status(500).json({ error: 'Error al registrar usuario: ' + insertError.message })
    }

    console.log('✅ Usuario insertado correctamente:', newUser)

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

    console.log('🔑 Tokens generados')

    // Establecer cookies httpOnly
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutos
    })

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    })

    console.log('🍪 Cookies establecidas')
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: userData
    })

  } catch (error) {
    console.error('❌ Error en registro:', error)
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message })
  }
})

// Endpoint de login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })
    }

    // Buscar usuario
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    // Generar tokens JWT
    const userData = {
      id: user.id,
      username: user.username,
      user_id: user.user_id,
      phone: user.phone,
      balance: user.balance
    }

    const accessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    const refreshToken = jwt.sign(userData, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN })

    // Establecer cookies httpOnly
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    })

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.json({
      message: 'Login exitoso',
      user: userData
    })

  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

// Endpoint de logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('access_token')
  res.clearCookie('refresh_token')
  res.json({ message: 'Logout exitoso' })
})

// Endpoint para refrescar token
app.post('/api/refresh', (req, res) => {
  const refreshToken = req.cookies.refresh_token

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' })
  }

  jwt.verify(refreshToken, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Refresh token inválido' })
    }

    const userData = {
      id: user.id,
      username: user.username,
      user_id: user.user_id,
      phone: user.phone,
      balance: user.balance
    }

    const newAccessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    })

    res.json({ message: 'Token refrescado' })
  })
})

// Endpoint protegido para verificar autenticación
app.get('/api/me', authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en puerto ${PORT}`)
})
