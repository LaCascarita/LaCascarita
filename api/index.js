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
      .limit(1)

    if (existingPhone && existingPhone.length > 0) {
      return res.status(400).json({ error: 'El teléfono ya está registrado' })
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
  res.setHeader('Access-Control-Allow-Origin', '*')
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

    res.setHeader('Set-Cookie', `admin_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`)

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
    res.json({ participations: data || [] })
  } catch (error) {
    res.status(500).json({ error: error.message })
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
