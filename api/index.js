import express from 'express'
import loginHandler from '../lib/handlers/login.js'
import registerHandler from '../lib/handlers/register.js'
import meHandler from '../lib/handlers/me.js'
import logoutHandler from '../lib/handlers/logout.js'
import sendVerificationHandler from '../lib/handlers/send-verification.js'
import verifyCodeHandler from '../lib/handlers/verify-code.js'
import adminLoginHandler from '../lib/handlers/admin-login.js'
import adminLeaguesHandler from '../lib/handlers/admin/leagues.js'
import adminFixturesHandler from '../lib/handlers/admin/fixtures.js'
import adminSaveJornadaHandler from '../lib/handlers/admin/save-jornada.js'
import adminGetJornadaHandler from '../lib/handlers/admin/get-jornada.js'
import footballFixturesHandler from '../lib/handlers/football/fixtures.js'
import footballJornadaMatchesHandler from '../lib/handlers/football/jornada-matches.js'

const app = express()
app.use(express.json())

// Auth
app.all('/api/login', loginHandler)
app.all('/api/register', registerHandler)
app.all('/api/me', meHandler)
app.all('/api/logout', logoutHandler)

// Password recovery
app.all('/api/send-verification', sendVerificationHandler)
app.all('/api/verify-code', verifyCodeHandler)

// Admin
app.all('/api/admin-login', adminLoginHandler)
app.all('/api/admin/leagues', adminLeaguesHandler)
app.all('/api/admin/fixtures', adminFixturesHandler)
app.all('/api/admin/save-jornada', adminSaveJornadaHandler)
app.all('/api/admin/get-jornada', adminGetJornadaHandler)

// Football
app.all('/api/football/fixtures', footballFixturesHandler)
app.all('/api/football/jornada-matches', footballJornadaMatchesHandler)

export default async function handler(req, res) {
  try {
    await new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  } catch (error) {
    console.error('Error en api/index:', error)
    res.status(500).json({ 
      error: 'Error interno del servidor: ' + (error.message || 'Unknown error'),
      stack: error.stack || 'No stack'
    })
  }
}
