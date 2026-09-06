import express from 'express'
import loginHandler from './handlers/login.js'
import registerHandler from './handlers/register.js'
import meHandler from './handlers/me.js'
import logoutHandler from './handlers/logout.js'
import sendVerificationHandler from './handlers/send-verification.js'
import verifyCodeHandler from './handlers/verify-code.js'
import adminLoginHandler from './handlers/admin-login.js'
import adminLeaguesHandler from './handlers/admin/leagues.js'
import adminFixturesHandler from './handlers/admin/fixtures.js'
import adminSaveJornadaHandler from './handlers/admin/save-jornada.js'
import adminGetJornadaHandler from './handlers/admin/get-jornada.js'
import footballFixturesHandler from './handlers/football/fixtures.js'
import footballJornadaMatchesHandler from './handlers/football/jornada-matches.js'

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
  await app(req, res)
}
