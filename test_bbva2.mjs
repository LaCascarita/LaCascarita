import 'dotenv/config'
import crypto from 'crypto'
import { getBbvaToken } from './api/_lib/bbva.js'

const PRIVATE_KEY = (process.env.BBVA_PRIVATE_KEY || '').replace(/\\n/g, '\n')
const API_BASE = process.env.BBVA_API_BASE || 'https://sbx.mx.bbvaapimarket.com/mx/business-payments/v1'

const body = JSON.stringify({ ping: true })
const fullPath = new URL(API_BASE).pathname.replace(/\/$/, '') + '/spei-transfers'
const host = new URL(API_BASE).host

const fp = crypto.createHash('sha256')
  .update(crypto.createPublicKey(PRIVATE_KEY).export({ format: 'der', type: 'spki' }))
  .digest('base64')

// Candidatos de keyId: Client ID de la captura, client_id env, fingerprint, id interno
const keyIds = [
  ['INTERNAL_ID', 'S9b18ae73badd48eab9aae66098a5723e'],
  ['CLIENT_ID', '1791427357'],
  ['FP', fp],
]

const token = await getBbvaToken()
for (const [name, keyId] of keyIds) {
  if (!keyId) continue
  const date = new Date().toUTCString()
  const digest = 'SHA-256=' + crypto.createHash('sha256').update(body).digest('base64')
  const signingString = `(request-target): post ${fullPath}\nhost: ${host}\ndate: ${date}\ndigest: ${digest}`
  const signature = crypto.sign('RSA-SHA256', Buffer.from(signingString), PRIVATE_KEY).toString('base64')
  const expires = Math.floor(Date.now() / 1000) + 300

  const res = await fetch(`${API_BASE}/spei-transfers`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Date': date,
      'Digest': digest,
      'Signature': `keyId="${keyId}",algorithm="rsa-sha256",expires="${expires}",headers="(request-target) host date digest",signature="${signature}"`
    },
    body
  })
  const data = await res.json().catch(() => ({}))
  console.log(`keyId=${name}: HTTP ${res.status} ->`, JSON.stringify(data).slice(0, 300))
}
