import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import twilio from 'twilio'
import express from 'express'

const app = express()
app.use(express.json())

let supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
let supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim()

if (supabaseUrl.endsWith('/')) {
  supabaseUrl = supabaseUrl.slice(0, -1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const JWT_SECRET = process.env.JWT_SECRET || process.env.VITE_JWT_SECRET || 'default_secret_change_in_production'

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const twilioVerifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID

// Vercel rewrites /api/login -> /api/index?path=login
app.use((req, res, next) => {
  if (req.query.path) {
    req.url = `/api/${req.query.path}`
  }
  next()
})

// Auth
app.post('/api/login', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    const userData = {
      id: user.id,
      username: user.username,
      user_id: user.user_id,
      phone: user.phone,
      balance: user.balance,
      role: user.role
    }

    const accessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' })

    res.setHeader('Set-Cookie', [
      `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${15 * 60}`,
      `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    ])

    res.json({ message: 'Login exitoso', user: userData })
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.post('/api/register', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Variables de entorno de Supabase no configuradas' })
    }

    const { username, phone, password } = req.body
    if (!username || !phone || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'El teléfono debe tener 10 dígitos' })
    }

    const { data: existingUsername } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .limit(1)

    if (existingUsername && existingUsername.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' })
    }

    const { data: existingPhone } = await supabase
      .from('users')
      .select('phone')
      .eq('phone', phone)
      .eq('role', 'user')
      .limit(1)

    if (existingPhone && existingPhone.length > 0) {
      return res.status(400).json({ error: 'El teléfono ya está registrado para un usuario' })
    }

    const randomNumber = Math.floor(Math.random() * 900000) + 100000
    const userId = `LC-${randomNumber}`
    const passwordHash = await bcrypt.hash(password, 10)

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ username, phone, user_id: userId, password_hash: passwordHash, balance: 0.00 }])
      .select()
      .single()

    if (insertError) {
      return res.status(500).json({ error: 'Error al registrar usuario: ' + insertError.message })
    }

    const userData = {
      id: newUser.id,
      username: newUser.username,
      user_id: newUser.user_id,
      phone: newUser.phone,
      balance: newUser.balance
    }

    const accessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: '15m' })
    const refreshToken = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' })

    res.setHeader('Set-Cookie', [
      `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${15 * 60}`,
      `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`
    ])

    res.status(201).json({ message: 'Usuario registrado exitosamente', user: userData })
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message })
  }
})

app.get('/api/me', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const cookies = req.headers.cookie || ''
    const access_token = cookies.split('; ').find(cookie => cookie.startsWith('access_token='))?.split('=')[1]

    if (!access_token) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const decoded = jwt.verify(access_token, JWT_SECRET)

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, user_id, phone, balance, role')
      .eq('id', decoded.id)
      .single()

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.json({ user: userData })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' })
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Token inválido' })
    }
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.post('/api/logout', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  res.setHeader('Set-Cookie', [
    'access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0',
    'refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  ])

  res.json({ message: 'Logout exitoso' })
})

app.post('/api/refresh', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const cookies = req.headers.cookie || ''
    const refresh_token = cookies.split('; ').find(cookie => cookie.startsWith('refresh_token='))?.split('=')[1]

    if (!refresh_token) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const decoded = jwt.verify(refresh_token, JWT_SECRET)

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, username, user_id, phone, balance, role')
      .eq('id', decoded.id)
      .single()

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const payload = {
      id: userData.id,
      username: userData.username,
      user_id: userData.user_id,
      phone: userData.phone,
      balance: userData.balance,
      role: userData.role
    }

    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })

    res.setHeader('Set-Cookie', [
      `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${60 * 60}`
    ])

    res.json({ user: payload })
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Sesión inválida' })
    }
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.post('/api/send-verification', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { username } = req.body
    if (!username) {
      return res.status(400).json({ error: 'El nombre de usuario es requerido' })
    }

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      return res.status(500).json({ error: 'Error de configuración del servidor' })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone, username')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const client = twilio(twilioAccountSid, twilioAuthToken)
    let phoneNumber = user.phone
    if (!phoneNumber.startsWith('+')) phoneNumber = `+52${phoneNumber}`

    await client.verify.v2.services(twilioVerifyServiceSid).verifications.create({
      to: phoneNumber,
      channel: 'sms'
    })

    const maskedPhone = phoneNumber.replace(/(\+\d{2})(\d{4})(\d{4})/, '$1****$3')
    res.json({ message: 'Código enviado exitosamente', maskedPhone, username: user.username })
  } catch (twilioError) {
    res.status(500).json({ error: 'Error al enviar código de verificación: ' + twilioError.message })
  }
})

app.post('/api/verify-code', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { username, code, newPassword } = req.body
    if (!username || !code || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    }

    if (!twilioAccountSid || !twilioAuthToken || !twilioVerifyServiceSid) {
      return res.status(500).json({ error: 'Error de configuración del servidor' })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('phone, username')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    const client = twilio(twilioAccountSid, twilioAuthToken)
    let phoneNumber = user.phone
    if (!phoneNumber.startsWith('+')) phoneNumber = `+52${phoneNumber}`

    const verificationCheck = await client.verify.v2.services(twilioVerifyServiceSid).verificationChecks.create({
      to: phoneNumber,
      code: code
    })

    if (verificationCheck.status !== 'approved') {
      return res.status(400).json({ error: 'Código inválido o expirado' })
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('username', username)

    if (updateError) {
      return res.status(500).json({ error: 'Error al actualizar contraseña' })
    }

    res.json({ message: 'Contraseña actualizada exitosamente' })
  } catch (twilioError) {
    res.status(500).json({ error: 'Error al verificar código: ' + twilioError.message })
  }
})

app.post('/api/admin-login', async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { username, password } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('role', 'admin')
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: 'admin' },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )

    const isProduction = process.env.NODE_ENV === 'production'
    const secureFlag = isProduction ? '; Secure' : ''
    const sameSite = isProduction ? 'None' : 'Lax'
    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=${sameSite}${secureFlag}`)

    res.status(200).json({
      success: true,
      user: { id: user.id, username: user.username, role: user.role }
    })
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' })
  }
})

app.get('/api/admin/leagues', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY
    if (!API_FOOTBALL_KEY) {
      return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' })
    }

    const response = await fetch(`https://apiv3.apifootball.com/?action=get_leagues&APIkey=${API_FOOTBALL_KEY}`)
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`)

    const data = await response.json()
    const allowedLeagues = [153, 164]
    const relevantLeagues = data.filter(league => {
      const leagueId = parseInt(league.league_id)
      return allowedLeagues.includes(leagueId)
    })

    res.json({ leagues: relevantLeagues })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leagues' })
  }
})

app.get('/api/admin/fixtures', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { league_id, from, to } = req.query
    const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY

    if (!API_FOOTBALL_KEY) return res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' })
    if (!league_id || !from || !to) return res.status(400).json({ error: 'Missing required parameters: league_id, from, to' })

    const response = await fetch(`https://apiv3.apifootball.com/?action=get_events&from=${from}&to=${to}&league_id=${league_id}&APIkey=${API_FOOTBALL_KEY}`)
    if (!response.ok) throw new Error(`API request failed: ${response.statusText}`)

    const data = await response.json()
    const matches = data.map(match => ({
      match_id: match.match_id,
      league_id: match.league_id,
      league_name: match.league_name,
      home_team_name: match.match_hometeam_name,
      away_team_name: match.match_awayteam_name,
      home_team_badge: match.team_home_badge,
      away_team_badge: match.team_away_badge,
      match_date: match.match_date && match.match_time
        ? `${match.match_date}T${match.match_time}:00`
        : match.match_date
    }))

    res.json({ matches })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fixtures' })
  }
})

app.post('/api/admin/save-jornada', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { type, name, start_date, end_date, matches } = req.body

    if (!type || !name || !start_date || !end_date || !matches || matches.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    if (matches.length > 9) return res.status(400).json({ error: 'Maximum 9 matches allowed' })
    if (!['media_semana', 'fin_de_semana', 'dominical'].includes(type)) return res.status(400).json({ error: 'Invalid jornada type' })

    // Solo puede haber una jornada activa por tipo
    await supabase
      .from('admin_jornadas')
      .update({ status: 'inactive' })
      .eq('type', type)
      .eq('status', 'active')

    const { data: jornada, error: jornadaError } = await supabase
      .from('admin_jornadas')
      .insert({ type, name, start_date, end_date, status: 'active' })
      .select()
      .single()

    if (jornadaError) throw jornadaError

    const partidosToInsert = matches.map((match, index) => ({
      jornada_id: jornada.id,
      match_id: match.match_id,
      league_id: match.league_id,
      league_name: match.league_name,
      home_team_name: match.home_team_name,
      away_team_name: match.away_team_name,
      home_team_badge: match.home_team_badge,
      away_team_badge: match.away_team_badge,
      match_date: match.match_date,
      match_status: match.match_status || 'NS',
      home_score: match.home_score || null,
      away_score: match.away_score || null,
      position: index + 1
    }))

    const { error: partidosError } = await supabase
      .from('admin_jornada_partidos')
      .insert(partidosToInsert)

    if (partidosError) throw partidosError

    res.json({ success: true, jornada })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save jornada' })
  }
})

app.get('/api/admin/get-jornada', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { type } = req.query
    if (!type) return res.status(400).json({ error: 'Missing type parameter' })

    const { data: jornada, error: jornadaError } = await supabase
      .from('admin_jornadas')
      .select('*')
      .eq('type', type)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (jornadaError && jornadaError.code !== 'PGRST116') throw jornadaError
    if (!jornada) return res.json({ jornada: null, matches: [] })

    const { data: matches, error: matchesError } = await supabase
      .from('admin_jornada_partidos')
      .select('*')
      .eq('jornada_id', jornada.id)
      .order('position')

    if (matchesError) throw matchesError

    res.json({ jornada, matches })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jornada' })
  }
})

app.get('/api/football/fixtures', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { date, bagType, leagueId } = req.query
    if (!date) return res.status(400).json({ error: 'Date parameter is required' })

    const API_KEY = process.env.API_FOOTBALL_KEY
    if (!API_KEY) return res.status(500).json({ error: 'API key not configured' })

    const BASE_URL = 'https://apiv3.apifootball.com/'
    let url = `${BASE_URL}?action=get_events&APIkey=${API_KEY}&from=${date}&to=${date}&match_status=FT`

    if (leagueId) url += `&league_id=${leagueId}`

    const response = await fetch(url)
    if (!response.ok) {
      const errorText = await response.text()
      return res.status(500).json({ error: `API request failed: ${response.status} ${response.statusText}`, details: errorText })
    }

    const data = await response.json()

    if (bagType) {
      const leagueMappings = {
        'media-semana': [153, 164],
        'fin-de-semana': [153, 164],
        'dominical': [153, 164]
      }

      const leagueIds = leagueMappings[bagType]
      if (leagueIds && Array.isArray(data)) {
        const filteredData = data.filter(match => leagueIds.includes(parseInt(match.league_id)))
        return res.json(filteredData)
      }
    }

    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Error fetching fixtures', details: error.message })
  }
})

app.get('/api/football/jornada-matches', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { type } = req.query
    if (!type) return res.status(400).json({ error: 'Missing type parameter' })

    const { data: jornada, error: jornadaError } = await supabase
      .from('admin_jornadas')
      .select('*')
      .eq('type', type)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (jornadaError && jornadaError.code !== 'PGRST116') throw jornadaError
    if (!jornada) return res.json({ jornada: null, matches: [] })

    const { data: matches, error: matchesError } = await supabase
      .from('admin_jornada_partidos')
      .select('*')
      .eq('jornada_id', jornada.id)
      .order('position')

    if (matchesError) throw matchesError

    res.json({ jornada, matches })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jornada matches' })
  }
})

app.get('/api/football/upcoming-matches', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const types = ['media_semana', 'fin_de_semana', 'dominical']
    const bagLabels = {
      media_semana: 'Media Semana',
      fin_de_semana: 'Fin de Semana',
      dominical: 'Dominical'
    }
    const result = []

    for (const type of types) {
      const { data: jornada, error: jornadaError } = await supabase
        .from('admin_jornadas')
        .select('id, name, type')
        .eq('type', type)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (jornadaError && jornadaError.code === 'PGRST116') continue
      if (jornadaError) throw jornadaError
      if (!jornada) continue

      const { data: matches, error: matchesError } = await supabase
        .from('admin_jornada_partidos')
        .select('id, home_team_name, away_team_name, match_date')
        .eq('jornada_id', jornada.id)
        .order('position', { ascending: true })
        .limit(1)

      if (matchesError) throw matchesError
      if (!matches || matches.length === 0) continue

      const match = matches[0]
      const dateObj = new Date(match.match_date)
      const dateStr = dateObj.toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      result.push({
        id: match.id,
        home: match.home_team_name,
        away: match.away_team_name,
        date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1),
        type: bagLabels[type] || jornada.name
      })
    }

    res.json(result)
  } catch (error) {
    console.error('Error fetching upcoming matches:', error)
    res.status(500).json({ error: 'Failed to fetch upcoming matches' })
  }
})

// ============================================================
// HELPERS DE AUTENTICACION Y SALDO
// ============================================================
const getUserFromToken = (req) => {
  try {
    const cookies = req.headers.cookie || ''
    const access_token = cookies.split('; ').find(cookie => cookie.startsWith('access_token='))?.split('=')[1]
    if (!access_token) return null
    return jwt.verify(access_token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

const getAdminFromToken = (req) => {
  try {
    const cookies = req.headers.cookie || ''
    const admin_token = cookies.split('; ').find(cookie => cookie.startsWith('admin_token='))?.split('=')[1]
    if (!admin_token) return null
    return jwt.verify(admin_token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

const createBalanceTransaction = async ({ user_id, type, amount, balance_before, balance_after, reference_id = null, participation_id = null, description = '' }) => {
  const { error } = await supabase
    .from('user_balance_transactions')
    .insert([{ user_id, type, amount, balance_before, balance_after, reference_id, participation_id, description, status: 'completed' }])
  if (error) throw new Error('Error creating transaction: ' + error.message)
}

const creditUserBalance = async (userId, amount, referenceId, description) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single()

  if (userError || !user) throw new Error('User not found')

  const balanceBefore = parseFloat(user.balance) || 0
  const balanceAfter = balanceBefore + amount

  const { error: updateError } = await supabase
    .from('users')
    .update({ balance: balanceAfter })
    .eq('id', userId)

  if (updateError) throw new Error('Error updating balance: ' + updateError.message)

  await createBalanceTransaction({
    user_id: userId,
    type: 'deposit',
    amount: amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    reference_id: referenceId,
    description
  })

  return balanceAfter
}

const creditPrizeBalance = async (userId, amount, participationId, description) => {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single()

  if (userError || !user) throw new Error('User not found')

  const balanceBefore = parseFloat(user.balance) || 0
  const balanceAfter = balanceBefore + amount

  const { error: updateError } = await supabase
    .from('users')
    .update({ balance: balanceAfter })
    .eq('id', userId)

  if (updateError) throw new Error('Error updating balance: ' + updateError.message)

  await createBalanceTransaction({
    user_id: userId,
    type: 'prize',
    amount: amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    participation_id: participationId,
    description
  })

  return balanceAfter
}

// ============================================================
// MERCADO PAGO - CREAR DEPOSITO
// ============================================================
app.post('/api/payments/deposit', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' })

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) return res.status(500).json({ error: 'Mercado Pago no configurado' })

    const externalReference = `LC-${user.id}-${Date.now()}`

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        user_id: user.id,
        provider: 'mercadopago',
        direction: 'deposit',
        amount: amount,
        status: 'pending',
        external_reference: externalReference
      }])
      .select()
      .single()

    if (paymentError) throw paymentError

    const origin = req.headers.origin || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://lacascarita.vercel.app')
    const preference = {
      items: [{
        title: `Recarga de saldo La Cascarita - ${user.username}`,
        quantity: 1,
        currency_id: 'MXN',
        unit_price: parseFloat(amount)
      }],
      external_reference: externalReference,
      notification_url: `${origin}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${origin}/dashboard?payment=success`,
        failure: `${origin}/dashboard?payment=failure`,
        pending: `${origin}/dashboard?payment=pending`
      },
      auto_return: 'approved'
    }

    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    })

    const mpData = await mpResponse.json()
    if (!mpResponse.ok) {
      throw new Error(mpData.message || 'Error creando preferencia en Mercado Pago')
    }

    await supabase
      .from('payments')
      .update({ provider_transaction_id: mpData.id, provider_metadata: mpData })
      .eq('id', payment.id)

    res.json({ init_point: mpData.init_point, payment_id: payment.id, external_reference: externalReference })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// SPEI - GENERAR REFERENCIA
// ============================================================
app.post('/api/payments/spei-request', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' })

    const externalReference = `LC-SPEI-${user.id}-${Date.now()}`

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert([{
        user_id: user.id,
        provider: 'spei',
        direction: 'deposit',
        amount: amount,
        status: 'pending',
        external_reference: externalReference
      }])
      .select()
      .single()

    if (paymentError) throw paymentError

    res.json({
      payment_id: payment.id,
      external_reference: externalReference,
      amount: amount,
      bank_name: process.env.SPEI_BANK_NAME || 'Banco ejemplo',
      account_number: process.env.SPEI_ACCOUNT_NUMBER || '000000000000000000',
      clabe: process.env.SPEI_CLABE || '000000000000000000',
      beneficiary: process.env.SPEI_BENEFICIARY || 'La Cascarita',
      message: 'Realiza la transferencia con la referencia indicada y un admin la confirmará.'
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// WEBHOOK MERCADO PAGO
// ============================================================
app.post('/api/webhooks/mercadopago', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const body = req.body
    const topic = body.type || body.topic
    const paymentId = body.data?.id || body.id

    if (topic === 'payment' && paymentId) {
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
      const mpData = await mpResponse.json()

      if (mpData.status === 'approved') {
        const externalReference = mpData.external_reference

        const { data: payment, error: findError } = await supabase
          .from('payments')
          .select('*')
          .eq('external_reference', externalReference)
          .single()

        if (findError || !payment) {
          return res.status(200).json({ message: 'Pago no encontrado en sistema' })
        }

        if (payment.status !== 'paid') {
          await supabase
            .from('payments')
            .update({ status: 'paid', paid_at: new Date().toISOString(), provider_metadata: mpData })
            .eq('id', payment.id)

          await creditUserBalance(payment.user_id, parseFloat(payment.amount), payment.id, 'Recarga Mercado Pago')
        }
      }
    }

    res.status(200).json({ received: true })
  } catch (error) {
    res.status(200).json({ received: true, error: error.message })
  }
})

// ============================================================
// ADMIN CONFIRMAR SPEI
// ============================================================
app.post('/api/admin/confirm-spei', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const admin = getUserFromToken(req)
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' })

    const { payment_id } = req.body
    if (!payment_id) return res.status(400).json({ error: 'payment_id requerido' })

    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .eq('provider', 'spei')
      .single()

    if (findError || !payment) return res.status(404).json({ error: 'Pago no encontrado' })
    if (payment.status === 'paid') return res.status(400).json({ error: 'Pago ya confirmado' })

    await supabase
      .from('payments')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', payment.id)

    await creditUserBalance(payment.user_id, parseFloat(payment.amount), payment.id, 'Recarga SPEI confirmada')

    res.json({ message: 'Recarga SPEI confirmada exitosamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// CONSULTAR SALDO Y MOVIMIENTOS
// ============================================================
app.get('/api/balance', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) return res.status(404).json({ error: 'Usuario no encontrado' })

    const { data: transactions, error: txError } = await supabase
      .from('user_balance_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (txError) throw txError

    const { data: participations, error: partError } = await supabase
      .from('participations')
      .select(`
        *,
        admin_jornadas ( type, name )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (partError) throw partError

    res.json({
      balance: parseFloat(userData.balance) || 0,
      transactions: transactions || [],
      participations: participations || []
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// SOLICITAR RETIRO
// ============================================================
app.post('/api/withdrawals', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { amount, bank_name, account_number, clabe, card_holder } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Monto inválido' })

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) return res.status(404).json({ error: 'Usuario no encontrado' })

    const balance = parseFloat(userData.balance) || 0
    if (balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' })

    const { data: withdrawal, error: withdrawError } = await supabase
      .from('withdrawals')
      .insert([{
        user_id: user.id,
        amount: amount,
        bank_name,
        account_number,
        clabe,
        card_holder,
        status: 'pending'
      }])
      .select()
      .single()

    if (withdrawError) throw withdrawError

    const newBalance = balance - amount
    await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', user.id)

    await createBalanceTransaction({
      user_id: user.id,
      type: 'withdrawal',
      amount: -amount,
      balance_before: balance,
      balance_after: newBalance,
      description: 'Solicitud de retiro pendiente'
    })

    res.json({ message: 'Solicitud de retiro creada', withdrawal })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// ENVIAR QUINIELA
// ============================================================
app.post('/api/quinielas', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { type, selections } = req.body
    if (!type || !selections || Object.keys(selections).length === 0) {
      return res.status(400).json({ error: 'Datos incompletos' })
    }

    const typeMap = { 'media_semana': 'MS', 'fin_de_semana': 'FS', 'dominical': 'DO' }
    const typeShort = typeMap[type] || 'XX'

    const { data: jornada, error: jornadaError } = await supabase
      .from('admin_jornadas')
      .select('*')
      .eq('type', type)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (jornadaError || !jornada) return res.status(404).json({ error: 'No hay jornada activa para este tipo' })

    const { data: partidos, error: partidosError } = await supabase
      .from('admin_jornada_partidos')
      .select('*')
      .eq('jornada_id', jornada.id)
      .order('position', { ascending: true })

    if (partidosError) throw partidosError
    if (!partidos || partidos.length === 0) return res.status(404).json({ error: 'La jornada no tiene partidos' })

    const missing = partidos.some(p => !selections[p.match_id] || selections[p.match_id].length === 0)
    if (missing) return res.status(400).json({ error: 'Debes seleccionar al menos un resultado en cada partido' })

    const totalQuinielas = partidos.reduce((acc, p) => acc * (selections[p.match_id]?.length || 1), 1)
    if (totalQuinielas < 2) return res.status(400).json({ error: 'Mínimo 2 quinielas (al menos un doble)' })

    const costPerQuiniela = 10
    const totalAmount = totalQuinielas * costPerQuiniela

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single()

    if (userError || !userData) return res.status(404).json({ error: 'Usuario no encontrado' })

    const currentBalance = parseFloat(userData.balance) || 0
    if (currentBalance < totalAmount) return res.status(400).json({ error: 'Saldo insuficiente' })

    const folioNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
    let folio = `LC-${typeShort}-${folioNum}`

    const { data: existing } = await supabase
      .from('participations')
      .select('id')
      .eq('folio', folio)
      .maybeSingle()

    if (existing) {
      folio = `LC-${typeShort}-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`
    }

    const { data: participation, error: partError } = await supabase
      .from('participations')
      .insert([{
        folio,
        user_id: user.id,
        jornada_id: jornada.id,
        payment_status: 'paid',
        participation_status: 'confirmed',
        payment_method: 'balance',
        payment_amount: totalAmount,
        payment_date: new Date().toISOString(),
        predictions_count: partidos.length,
        correct_predictions: 0,
        prize_amount: 0.00,
        prize_status: 'none'
      }])
      .select()
      .single()

    if (partError) throw partError

    const predictionsToInsert = partidos.flatMap(partido => {
      const matchSelections = selections[partido.match_id] || []
      return matchSelections.map(opt => {
        let prediction
        if (opt === 'local') prediction = 'home'
        else if (opt === 'empate') prediction = 'draw'
        else if (opt === 'visitante') prediction = 'away'
        else prediction = opt

        return {
          participation_id: participation.id,
          match_id: partido.id,
          prediction
        }
      })
    })

    const { error: predError } = await supabase
      .from('predictions')
      .insert(predictionsToInsert)

    if (predError) throw predError

    const createdParticipations = [participation]

    const newBalance = currentBalance - totalAmount
    await supabase.from('users').update({ balance: newBalance }).eq('id', user.id)

    await createBalanceTransaction({
      user_id: user.id,
      type: 'bet',
      amount: -totalAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: `Compra de ${totalQuinielas} quinielas en ${type}`
    })

    res.json({
      message: 'Quinielas enviadas correctamente',
      totalQuinielas,
      totalAmount,
      participations: createdParticipations
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// HISTORIAL DE PARTICIPACIONES
// ============================================================
app.get('/api/participations', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { data, error } = await supabase
      .from('participations')
      .select(`
        *,
        admin_jornadas ( type, name )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    const jornadaIds = [...new Set((data || []).map(p => p.jornada_id).filter(Boolean))]
    for (const jid of jornadaIds) {
      await syncJornadaResults(jid)
    }

    const { data: updated, error: updatedError } = await supabase
      .from('participations')
      .select(`
        *,
        admin_jornadas ( type, name )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (updatedError) throw updatedError
    res.json({ participations: updated || [] })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// DETALLE DE PARTICIPACIÓN
// ============================================================
app.get('/api/participations/:id', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { id } = req.params
    if (!id) return res.status(400).json({ error: 'Falta el ID de la participación' })

    const { data: base, error: baseError } = await supabase
      .from('participations')
      .select('jornada_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (baseError || !base) return res.status(404).json({ error: 'Participación no encontrada' })

    await syncJornadaResults(base.jornada_id)

    const { data: participation, error: partError } = await supabase
      .from('participations')
      .select(`
        *,
        admin_jornadas ( type, name )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (partError || !participation) return res.status(404).json({ error: 'Participación no encontrada' })

    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('participation_id', participation.id)

    if (predError) throw predError

    const matchIds = (predictions || []).map(p => p.match_id)
    let matches = []

    if (matchIds.length > 0) {
      const { data: matchData, error: matchesError } = await supabase
        .from('admin_jornada_partidos')
        .select('*')
        .in('id', matchIds)
        .order('position', { ascending: true })

      if (matchesError) throw matchesError
      matches = matchData || []
    }

    const predictionsWithMatches = (predictions || []).map(pred => ({
      ...pred,
      match: matches.find(m => m.id === pred.match_id) || null
    }))

    res.json({
      participation,
      matches,
      predictions: predictionsWithMatches
    })
  } catch (error) {
    console.error('Error fetching participation detail:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// ACUMULADO DE BOLSAS (70% PREMIOS)
// ============================================================
app.get('/api/football/bag-prizes', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const types = ['media_semana', 'fin_de_semana', 'dominical']
    const bagLabels = {
      media_semana: 'Media Semana',
      fin_de_semana: 'Fin de Semana',
      dominical: 'Dominical'
    }
    const result = []

    for (const type of types) {
      const { data: jornada, error: jornadaError } = await supabase
        .from('admin_jornadas')
        .select('id, name, type')
        .eq('type', type)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (jornadaError && jornadaError.code === 'PGRST116') continue
      if (jornadaError) throw jornadaError
      if (!jornada) continue

      const { data: partidos, error: partidosError } = await supabase
        .from('admin_jornada_partidos')
        .select('id')
        .eq('jornada_id', jornada.id)

      if (partidosError) throw partidosError

      const { data: participations, error: partError } = await supabase
        .from('participations')
        .select('payment_amount, user_id')
        .eq('jornada_id', jornada.id)
        .eq('participation_status', 'confirmed')

      if (partError) throw partError

      const totalCollected = (participations || []).reduce(
        (sum, p) => sum + (parseFloat(p.payment_amount) || 0),
        0
      )

      let carryover = 0
      if (type !== 'dominical') {
        const { data: carry } = await supabase
          .from('prize_carryover')
          .select('amount')
          .eq('type', type)
          .maybeSingle()
        carryover = parseFloat(carry?.amount) || 0
      }

      const prizePool = totalCollected * 0.7 + carryover
      const participantsCount = new Set((participations || []).map(p => p.user_id)).size

      result.push({
        type,
        label: bagLabels[type],
        jornada_id: jornada.id,
        jornada_name: jornada.name,
        total_collected: totalCollected,
        prize_pool: prizePool,
        carryover,
        house_amount: totalCollected * 0.3,
        participations_count: (participations || []).length,
        participants_count: participantsCount,
        matches_count: (partidos || []).length
      })
    }

    res.json(result)
  } catch (error) {
    console.error('Error fetching bag prizes:', error)
    res.status(500).json({ error: error.message })
  }
})

const syncJornadaResults = async (jornada_id) => {
  try {
    console.log('[syncJornadaResults] start jornada_id:', jornada_id)
    const { data: matches } = await supabase
      .from('admin_jornada_partidos')
      .select('id, match_id, home_score, away_score, match_status, league_id, match_date')
      .eq('jornada_id', jornada_id)

    console.log('[syncJornadaResults] matches found:', (matches || []).length)
    const pendingMatches = (matches || []).filter(m => m.home_score == null || m.away_score == null)
    console.log('[syncJornadaResults] pending matches:', pendingMatches.length)

    const getWinner = (h, a) => h === a ? 'draw' : h > a ? 'home' : 'away'
    const participationIds = new Set()

    if (pendingMatches.length > 0) {
      const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY
      if (!API_FOOTBALL_KEY) {
        console.warn('API_FOOTBALL_KEY not configured')
      } else {
        console.log('[syncJornadaResults] API_FOOTBALL_KEY present')

        for (const match of pendingMatches) {
          console.log('[syncJornadaResults] checking match:', match.id, 'api match_id:', match.match_id, 'league_id:', match.league_id, 'match_date:', match.match_date)
          if (!match.league_id || !match.match_date) {
            console.log('[syncJornadaResults] missing league_id or match_date for match:', match.id)
            continue
          }
          const matchDate = match.match_date.split('T')[0]
          const response = await fetch(`https://apiv3.apifootball.com/?action=get_events&from=${matchDate}&to=${matchDate}&league_id=${match.league_id}&APIkey=${API_FOOTBALL_KEY}`)
          console.log('[syncJornadaResults] response status:', response.status, 'ok:', response.ok)
          if (!response.ok) continue
          const data = await response.json()
          console.log('[syncJornadaResults] response data is array:', Array.isArray(data), 'length:', (data || []).length)
          if (!Array.isArray(data) || data.length === 0) {
            console.log('[syncJornadaResults] no data for match:', match.match_id, 'on', matchDate)
            continue
          }
          const event = data.find(e => String(e.match_id) === String(match.match_id))
          console.log('[syncJornadaResults] found event:', event ? {
            match_id: event.match_id,
            match_status: event.match_status,
            home: event.match_hometeam_score,
            away: event.match_awayteam_score
          } : null)
          if (!event) {
            console.log('[syncJornadaResults] match not found in events list:', match.match_id)
            continue
          }
          const finishedStatuses = ['FT', 'AET', 'PEN', 'Finished', 'FINISHED']
          if (!finishedStatuses.includes(event.match_status)) {
            console.log('[syncJornadaResults] match not finished, status:', event.match_status)
            continue
          }

          const homeScore = parseInt(event.match_hometeam_score, 10)
          const awayScore = parseInt(event.match_awayteam_score, 10)
          console.log('[syncJornadaResults] parsed scores:', homeScore, awayScore)
          if (isNaN(homeScore) || isNaN(awayScore)) {
            console.log('[syncJornadaResults] invalid scores, skip')
            continue
          }

          const { error } = await supabase
            .from('admin_jornada_partidos')
            .update({ home_score: homeScore, away_score: awayScore, match_status: event.match_status })
            .eq('id', match.id)
          console.log('[syncJornadaResults] update match error:', error ? error.message : 'none')
          if (error) continue

          const result = getWinner(homeScore, awayScore)
          console.log('[syncJornadaResults] calculated result:', result)

          const { data: predictions } = await supabase
            .from('predictions')
            .select('id, participation_id, prediction')
            .eq('match_id', match.id)
          console.log('[syncJornadaResults] predictions for match:', match.id, 'count:', (predictions || []).length)

          for (const pred of (predictions || [])) {
            const isCorrect = pred.prediction === result
            console.log('[syncJornadaResults] pred:', pred.id, 'prediction:', pred.prediction, 'is_correct:', isCorrect)
            await supabase
              .from('predictions')
              .update({ is_correct: isCorrect, points: isCorrect ? 1 : 0 })
              .eq('id', pred.id)
            participationIds.add(pred.participation_id)
          }
        }
      }
    }

    const scoredMatches = (matches || []).filter(m => m.home_score != null && m.away_score != null)
    console.log('[syncJornadaResults] scored matches to validate:', scoredMatches.length)
    for (const match of scoredMatches) {
      console.log('[syncJornadaResults] validating scored match:', match.id, 'home:', match.home_score, 'away:', match.away_score)
      const result = getWinner(parseInt(match.home_score, 10), parseInt(match.away_score, 10))
      const { data: predictions } = await supabase
        .from('predictions')
        .select('id, participation_id, prediction')
        .eq('match_id', match.id)
      console.log('[syncJornadaResults] predictions for scored match:', match.id, 'count:', (predictions || []).length)
      for (const pred of (predictions || [])) {
        const isCorrect = pred.prediction === result
        console.log('[syncJornadaResults] scored pred:', pred.id, 'prediction:', pred.prediction, 'is_correct:', isCorrect)
        await supabase
          .from('predictions')
          .update({ is_correct: isCorrect, points: isCorrect ? 1 : 0 })
          .eq('id', pred.id)
        participationIds.add(pred.participation_id)
      }
    }

    const totalMatches = (matches || []).length
    console.log('[syncJornadaResults] total matches:', totalMatches)

    const { data: allParts } = await supabase
      .from('participations')
      .select('id')
      .eq('jornada_id', jornada_id)
    const pids = (allParts || []).map(p => p.id)
    console.log('[syncJornadaResults] participations to update:', pids.length)

    if (pids.length === 0) {
      await maybeAutoDistributePrizes(jornada_id)
      return
    }

    const { data: allPreds } = await supabase
      .from('predictions')
      .select('participation_id, match_id, is_correct')
      .in('participation_id', pids)
    const byPart = new Map()
    for (const p of (allPreds || [])) {
      if (!byPart.has(p.participation_id)) byPart.set(p.participation_id, new Map())
      const matchesMap = byPart.get(p.participation_id)
      const current = matchesMap.get(p.match_id) || false
      matchesMap.set(p.match_id, current || p.is_correct === true)
    }

    for (const pid of pids) {
      const matchesMap = byPart.get(pid) || new Map()
      const correct = [...matchesMap.values()].filter(Boolean).length
      console.log('[syncJornadaResults] update participation:', pid, 'correct:', correct, 'total:', totalMatches)
      await supabase
        .from('participations')
        .update({ correct_predictions: correct, predictions_count: totalMatches })
        .eq('id', pid)
    }

    await maybeAutoDistributePrizes(jornada_id)
  } catch (error) {
    console.error('Error syncing jornada results:', error)
  }
}

// ============================================================
// DISTRIBUCION DE PREMIOS
// ============================================================
// Reglas:
// - Bolsa = 70% de lo recaudado + acumulado del mismo tipo de jornada.
// - Media semana / fin de semana: 80% al 1er lugar, 20% al 2do lugar.
// - Dominical: todo el 70% al 1er lugar (sin 2do lugar ni acumulado).
// - Se cuenta por quiniela/folio (participacion), no por usuario:
//   cada ticket ganador recibe una parte independiente.
// - 1er lugar: quinielas con mas aciertos; se reparte en partes iguales.
// - 2do lugar: quinielas con la segunda mayor cantidad de aciertos;
//   se reparte entre ellas solo si son 20 o menos. Si son mas de 20
//   (o no hay 2do lugar), el 20% se acumula para la siguiente
//   jornada del mismo tipo.
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

const distributeJornadaPrizes = async (jornada) => {
  const isDominical = jornada.type === 'dominical'

  const { data: matches, error: matchesError } = await supabase
    .from('admin_jornada_partidos')
    .select('id, home_score, away_score')
    .eq('jornada_id', jornada.id)

  if (matchesError) throw matchesError
  if (!matches || matches.length === 0) throw new Error('La jornada no tiene partidos')

  const pendingMatches = matches.filter(m => m.home_score == null || m.away_score == null)
  if (pendingMatches.length > 0) {
    throw new Error(`Aún hay ${pendingMatches.length} partido(s) sin resultado`)
  }

  const { data: participations, error: partError } = await supabase
    .from('participations')
    .select('id, folio, user_id, payment_amount, correct_predictions, created_at')
    .eq('jornada_id', jornada.id)
    .eq('participation_status', 'confirmed')

  if (partError) throw partError

  if (!participations || participations.length === 0) {
    await supabase
      .from('admin_jornadas')
      .update({ status: 'completed' })
      .eq('id', jornada.id)
    return { distributed: false, reason: 'Sin participaciones confirmadas' }
  }

  const totalCollected = participations.reduce((sum, p) => sum + (parseFloat(p.payment_amount) || 0), 0)

  let carryoverIn = 0
  if (!isDominical) {
    const { data: carry } = await supabase
      .from('prize_carryover')
      .select('amount')
      .eq('type', jornada.type)
      .maybeSingle()
    carryoverIn = parseFloat(carry?.amount) || 0
  }

  const prizePool = round2(totalCollected * 0.7 + carryoverIn)
  const firstPlacePool = isDominical ? prizePool : round2(prizePool * 0.8)
  const secondPlacePool = isDominical ? 0 : round2(prizePool * 0.2)

  // Cada quiniela/folio cuenta de forma independiente
  const distinctScores = [...new Set(participations.map(p => p.correct_predictions || 0))].sort((a, b) => b - a)
  const firstScore = distinctScores[0]
  const secondScore = distinctScores.length > 1 ? distinctScores[1] : null

  const firstWinners = participations.filter(p => (p.correct_predictions || 0) === firstScore)
  const secondWinners = secondScore != null
    ? participations.filter(p => (p.correct_predictions || 0) === secondScore)
    : []

  const paySecondPlace = !isDominical && secondWinners.length > 0 && secondWinners.length <= 20
  const carryoverOut = isDominical ? 0 : (paySecondPlace ? 0 : secondPlacePool)

  const firstPlaceShare = firstWinners.length > 0 ? round2(firstPlacePool / firstWinners.length) : 0
  const secondPlaceShare = paySecondPlace ? round2(secondPlacePool / secondWinners.length) : 0

  // El insert funciona como bloqueo de idempotencia: si la jornada ya
  // fue repartida (unique jornada_id), se aborta antes de pagar.
  const { data: distribution, error: distError } = await supabase
    .from('prize_distributions')
    .insert([{
      jornada_id: jornada.id,
      jornada_type: jornada.type,
      total_collected: round2(totalCollected),
      carryover_in: carryoverIn,
      prize_pool: prizePool,
      first_place_pool: firstPlacePool,
      second_place_pool: secondPlacePool,
      first_place_winners: firstWinners.length,
      second_place_winners: paySecondPlace ? secondWinners.length : 0,
      first_place_share: firstPlaceShare,
      second_place_share: secondPlaceShare,
      carryover_out: carryoverOut
    }])
    .select()
    .single()

  if (distError) {
    if (distError.code === '23505') return { distributed: false, alreadyDistributed: true }
    throw distError
  }

  try {
    for (const winner of firstWinners) {
      await creditPrizeBalance(winner.user_id, firstPlaceShare, winner.id, `Premio 1er lugar - ${jornada.name} - ${winner.folio}`)
      await supabase
        .from('participations')
        .update({ position: 1, prize_amount: firstPlaceShare, prize_status: 'paid' })
        .eq('id', winner.id)
    }

    if (paySecondPlace) {
      for (const winner of secondWinners) {
        await creditPrizeBalance(winner.user_id, secondPlaceShare, winner.id, `Premio 2do lugar - ${jornada.name} - ${winner.folio}`)
        await supabase
          .from('participations')
          .update({ position: 2, prize_amount: secondPlaceShare, prize_status: 'paid' })
          .eq('id', winner.id)
      }
    }

    if (!isDominical) {
      await supabase
        .from('prize_carryover')
        .upsert({ type: jornada.type, amount: carryoverOut, updated_at: new Date().toISOString() }, { onConflict: 'type' })
    }

    await supabase
      .from('admin_jornadas')
      .update({ status: 'completed' })
      .eq('id', jornada.id)
  } catch (payError) {
    // Permitir reintento: sin el registro de distribucion el bloqueo se libera
    await supabase.from('prize_distributions').delete().eq('id', distribution.id)
    throw payError
  }

  return {
    distributed: true,
    distribution,
    firstPlaceWinners: firstWinners.length,
    secondPlaceWinners: paySecondPlace ? secondWinners.length : 0,
    firstPlaceShare,
    secondPlaceShare,
    carryoverOut
  }
}

const maybeAutoDistributePrizes = async (jornada_id) => {
  try {
    const { data: allMatches } = await supabase
      .from('admin_jornada_partidos')
      .select('id, home_score, away_score')
      .eq('jornada_id', jornada_id)

    if (!allMatches || allMatches.length === 0) return

    const unfinished = allMatches.filter(m => m.home_score == null || m.away_score == null)
    if (unfinished.length > 0) return

    const { data: jornada } = await supabase
      .from('admin_jornadas')
      .select('*')
      .eq('id', jornada_id)
      .single()

    if (!jornada || jornada.status === 'completed') return

    const result = await distributeJornadaPrizes(jornada)
    console.log('[maybeAutoDistributePrizes] jornada:', jornada_id, 'result:', result)
  } catch (error) {
    console.error('Error auto-distributing prizes:', error)
  }
}

// ============================================================
// PARTICIPACIONES POR JORNADA PARA PANEL ADMIN (EXCEL)
// ============================================================
app.get('/api/admin/jornada-participations', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { type } = req.query
    if (!type) return res.status(400).json({ error: 'Missing type parameter' })

    const { data: jornada, error: jornadaError } = await supabase
      .from('admin_jornadas')
      .select('id, name, type, start_date, end_date, status')
      .eq('type', type)
      .in('status', ['active', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (jornadaError && jornadaError.code === 'PGRST116') return res.json({ jornada: null, matches: [], participations: [] })
    if (jornadaError) throw jornadaError
    if (!jornada) return res.json({ jornada: null, matches: [], participations: [] })

    await syncJornadaResults(jornada.id)

    // syncJornadaResults puede haber repartido premios y marcado la jornada
    // como completed; releer el status para reflejar el estado real
    const { data: freshJornada } = await supabase
      .from('admin_jornadas')
      .select('status')
      .eq('id', jornada.id)
      .single()
    if (freshJornada) jornada.status = freshJornada.status

    const { data: matches, error: matchesError } = await supabase
      .from('admin_jornada_partidos')
      .select('*')
      .eq('jornada_id', jornada.id)
      .order('position', { ascending: true })

    if (matchesError) throw matchesError

    const { data: participations, error: partError } = await supabase
      .from('participations')
      .select('id, folio, user_id, payment_amount, predictions_count, correct_predictions, position, prize_amount, prize_status, created_at, users(username)')
      .eq('jornada_id', jornada.id)
      .eq('participation_status', 'confirmed')
      .order('created_at', { ascending: false })

    if (partError) throw partError

    const participationIds = (participations || []).map(p => p.id)
    let predictions = []

    if (participationIds.length > 0) {
      const { data: preds, error: predError } = await supabase
        .from('predictions')
        .select('id, participation_id, match_id, prediction')
        .in('participation_id', participationIds)

      if (predError) throw predError
      predictions = preds || []
    }

    const participationsWithPredictions = (participations || []).map(p => ({
      ...p,
      predictions: predictions.filter(pred => pred.participation_id === p.id)
    }))

    const { data: distribution } = await supabase
      .from('prize_distributions')
      .select('*')
      .eq('jornada_id', jornada.id)
      .maybeSingle()

    let carryover = 0
    if (jornada.type !== 'dominical') {
      const { data: carry } = await supabase
        .from('prize_carryover')
        .select('amount')
        .eq('type', jornada.type)
        .maybeSingle()
      carryover = parseFloat(carry?.amount) || 0
    }

    res.json({
      jornada,
      matches: matches || [],
      participations: participationsWithPredictions,
      distribution: distribution || null,
      carryover
    })
  } catch (error) {
    console.error('Error fetching jornada participations:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================================
// REPARTIR PREMIOS DE UNA JORNADA (MANUAL)
// ============================================================
app.post('/api/admin/distribute-prizes', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const admin = getAdminFromToken(req)
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' })

    const { type } = req.body
    if (!type || !['media_semana', 'fin_de_semana', 'dominical'].includes(type)) {
      return res.status(400).json({ error: 'Tipo de jornada inválido' })
    }

    const { data: jornada, error: jornadaError } = await supabase
      .from('admin_jornadas')
      .select('*')
      .eq('type', type)
      .in('status', ['active', 'inactive'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (jornadaError || !jornada) {
      return res.status(404).json({ error: 'No hay jornada pendiente para este tipo' })
    }

    await syncJornadaResults(jornada.id)

    const result = await distributeJornadaPrizes(jornada)

    if (result.alreadyDistributed) {
      const { data: existing } = await supabase
        .from('prize_distributions')
        .select('*')
        .eq('jornada_id', jornada.id)
        .single()
      return res.json({ message: 'Los premios de esta jornada ya fueron repartidos', alreadyDistributed: true, distribution: existing })
    }
    if (!result.distributed) {
      return res.status(400).json({ error: result.reason || 'No se pudo repartir' })
    }

    res.json({ message: 'Premios repartidos correctamente', ...result })
  } catch (error) {
    console.error('Error distributing prizes:', error)
    res.status(500).json({ error: error.message })
  }
})

app.get('/api/admin/users', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const admin = getAdminFromToken(req)
    if (!admin || admin.role !== 'admin') return res.status(403).json({ error: 'Acceso denegado' })

    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, phone, balance, created_at')
      .eq('role', 'user')
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json({ users: users || [] })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
})

// ============================================================
// RANKING DE USUARIOS POR ACIERTOS
// ============================================================
app.get('/api/ranking', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .eq('role', 'user')
    if (usersError) throw usersError

    const { data: parts, error: partsError } = await supabase
      .from('participations')
      .select('user_id, correct_predictions')
    if (partsError) throw partsError

    const byUser = new Map()
    for (const u of (users || [])) {
      byUser.set(u.id, { user_id: u.id, username: u.username, points: 0 })
    }
    for (const p of (parts || [])) {
      const entry = byUser.get(p.user_id)
      if (entry) {
        entry.points += (p.correct_predictions || 0)
      } else {
        byUser.set(p.user_id, { user_id: p.user_id, username: 'Usuario', points: (p.correct_predictions || 0) })
      }
    }

    const ranking = [...byUser.values()]
    ranking.sort((a, b) => b.points - a.points)

    const ranked = ranking.map((u, idx) => ({ pos: idx + 1, ...u }))
    const my = ranked.find(r => r.user_id === user.id)

    res.json({ ranking: ranked, currentUser: my || null })
  } catch (error) {
    console.error('Error fetching ranking:', error)
    res.status(500).json({ error: 'Error al obtener ranking' })
  }
})

// ============================================================
// ESTADÍSTICAS DEL USUARIO
// ============================================================
app.get('/api/me/stats', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const user = getUserFromToken(req)
    if (!user) return res.status(401).json({ error: 'No autorizado' })

    const { data: parts, error: partsError } = await supabase
      .from('participations')
      .select('id, jornada_id, correct_predictions, predictions_count')
      .eq('user_id', user.id)
    if (partsError) throw partsError

    const participationIds = (parts || []).map(p => p.id)
    const jornadaIds = [...new Set((parts || []).map(p => p.jornada_id))]

    const { data: jornadas, error: jornadasError } = await supabase
      .from('admin_jornadas')
      .select('id, type')
      .in('id', jornadaIds)
    if (jornadasError) throw jornadasError
    const jornadaType = new Map((jornadas || []).map(j => [j.id, j.type]))

    const { data: matches, error: matchesError } = await supabase
      .from('admin_jornada_partidos')
      .select('id, jornada_id, match_date, home_score, away_score')
      .in('jornada_id', jornadaIds)
    if (matchesError) throw matchesError
    const matchMap = new Map((matches || []).map(m => [m.id, m]))

    const { data: preds, error: predsError } = await supabase
      .from('predictions')
      .select('id, participation_id, match_id, prediction, is_correct')
      .in('participation_id', participationIds)
    if (predsError) throw predsError

    const totalParticipations = (parts || []).length

    const totalCorrect = (parts || []).reduce((s, p) => s + (p.correct_predictions || 0), 0)
    const totalMatches = (parts || []).reduce((s, p) => s + (p.predictions_count || 0), 0)
    const globalAccuracy = totalMatches > 0 ? Math.round((totalCorrect / totalMatches) * 100) : 0

    const byMatch = new Map()
    for (const p of (preds || [])) {
      const m = matchMap.get(p.match_id)
      if (!m || m.home_score == null || m.away_score == null) continue
      if (!byMatch.has(p.match_id)) byMatch.set(p.match_id, { match: m, hasCorrect: false })
      const entry = byMatch.get(p.match_id)
      entry.hasCorrect = entry.hasCorrect || p.is_correct === true
    }
    const matchList = [...byMatch.values()].sort((a, b) => {
      const dateA = new Date(a.match.match_date || 0)
      const dateB = new Date(b.match.match_date || 0)
      return dateA - dateB
    })
    let bestStreak = 0
    let currentStreak = 0
    for (const item of matchList) {
      if (item.hasCorrect) {
        currentStreak++
        bestStreak = Math.max(bestStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    let quinielasWon = 0
    if (jornadaIds.length > 0) {
      const { data: allParts, error: allPartsError } = await supabase
        .from('participations')
        .select('user_id, jornada_id, correct_predictions')
        .in('jornada_id', jornadaIds)
      if (allPartsError) throw allPartsError
      const jornadaGroups = new Map()
      for (const p of (allParts || [])) {
        if (!jornadaGroups.has(p.jornada_id)) jornadaGroups.set(p.jornada_id, { max: -1, userCorrect: null })
        const g = jornadaGroups.get(p.jornada_id)
        if (p.correct_predictions > g.max) g.max = p.correct_predictions
        if (p.user_id === user.id) g.userCorrect = p.correct_predictions
      }
      for (const [_, g] of jornadaGroups) {
        if (g.userCorrect != null && g.max > 0 && g.userCorrect === g.max) quinielasWon++
      }
    }

    const dist = { home: 0, draw: 0, away: 0 }
    const totalPreds = (preds || []).length
    for (const p of (preds || [])) dist[p.prediction] = (dist[p.prediction] || 0) + 1
    const distribution = {
      home: totalPreds > 0 ? Math.round((dist.home / totalPreds) * 100) : 0,
      draw: totalPreds > 0 ? Math.round((dist.draw / totalPreds) * 100) : 0,
      away: totalPreds > 0 ? Math.round((dist.away / totalPreds) * 100) : 0,
    }

    const byType = {}
    for (const p of (parts || [])) {
      const type = jornadaType.get(p.jornada_id)
      if (!type) continue
      if (!byType[type]) byType[type] = { correct: 0, total: 0 }
      byType[type].correct += (p.correct_predictions || 0)
      byType[type].total += (p.predictions_count || 0)
    }
    const typeLabels = { media_semana: 'Media Semana', fin_de_semana: 'Fin de Semana', dominical: 'Dominical' }
    const performanceByType = {}
    for (const [type, typeName] of Object.entries(typeLabels)) {
      const d = byType[type] || { correct: 0, total: 0 }
      performanceByType[type] = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0
    }

    res.json({
      totalParticipations,
      globalAccuracy,
      bestStreak,
      quinielasWon,
      distribution,
      performanceByType
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

export default async function handler(req, res) {
  try {
    await new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  } catch (error) {
    res.status(500).json({
      error: 'Error interno del servidor: ' + (error.message || 'Unknown error'),
      stack: error.stack || 'No stack'
    })
  }
}
