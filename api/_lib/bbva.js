import crypto from 'crypto'

const APP_ID = process.env.BBVA_APP_ID
const SECRET = process.env.BBVA_SECRET_OAUTH
const PRIVATE_KEY = (process.env.BBVA_PRIVATE_KEY || '').replace(/\\n/g, '\n')
const API_BASE = (process.env.BBVA_API_BASE || 'https://sbx.mx.bbvaapimarket.com/mx/business-payments/v1').replace(/\/$/, '')
const TOKEN_URL = process.env.BBVA_TOKEN_URL || 'https://sbx.mx.bbvaapimarket.com/auth/oauth/v2/token'
const SOURCE_ACCOUNT = process.env.BBVA_SOURCE_ACCOUNT
const SENDER_RFC = process.env.BBVA_SENDER_RFC
const BENEFICIARY_RFC = process.env.BBVA_BENEFICIARY_RFC || 'XEXX010101000'

let cachedToken = null
let tokenExpiresAt = 0

export const bbvaConfigured = () =>
  Boolean(APP_ID && SECRET && PRIVATE_KEY && SOURCE_ACCOUNT && SENDER_RFC)

export const getBbvaToken = async () => {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) return cachedToken

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${APP_ID}:${SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.access_token) {
    throw new Error(`BBVA token error ${res.status}: ${JSON.stringify(data)}`)
  }

  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + (data.expires_in || 1800) * 1000
  return cachedToken
}

// keyId de la firma: configurable por env; por defecto fingerprint SHA-256 de la llave publica
const getKeyId = () => {
  if (process.env.BBVA_KEY_ID) return process.env.BBVA_KEY_ID
  const der = crypto.createPublicKey(PRIVATE_KEY).export({ format: 'der', type: 'spki' })
  return crypto.createHash('sha256').update(der).digest('base64')
}

// HTTP Signature (draft): (request-target) host date [digest] firmado con RSA-SHA512
const signRequest = ({ method, path, body }) => {
  const host = new URL(API_BASE).host
  const date = new Date().toUTCString()

  let headersList = '(request-target) host date'
  let signingString = `(request-target): ${method.toLowerCase()} ${path}\nhost: ${host}\ndate: ${date}`

  const headers = { Date: date }

  if (body !== undefined) {
    const digest = 'SHA-512=' + crypto.createHash('sha512').update(body).digest('base64')
    headers['Digest'] = digest
    headersList += ' digest'
    signingString += `\ndigest: ${digest}`
  }

  const signature = crypto.sign('RSA-SHA512', Buffer.from(signingString), PRIVATE_KEY).toString('base64')
  const expires = Math.floor(Date.now() / 1000) + 300

  headers['Signature'] =
    `keyId="${getKeyId()}",algorithm="rsa-sha512",expires="${expires}",headers="${headersList}",signature="${signature}"`

  return headers
}

export const bbvaRequest = async (method, path, bodyObj) => {
  const token = await getBbvaToken()
  const body = bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...signRequest({ method, path, body })
    },
    ...(body !== undefined && { body })
  })

  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

// Transferencia SPEI a CLABE. Devuelve { ok, status, data } donde data incluye
// sequenceReference, entityId.trackingId y entityId.applicationId
export const createSpeiTransfer = async ({ clabe, beneficiaryName, amount }) => {
  const bankCode = `0${clabe.substring(0, 3)}`
  const today = new Date().toISOString().slice(0, 10)
  const numericReference = String(Date.now()).slice(-7)

  return bbvaRequest('POST', '/spei-transfers', {
    operationDate: today,
    concept: 'RETIRO CASCARITA',
    numericReference,
    reference: 'RETIRO',
    sender: {
      contract: {
        product: {
          checkAccount: { accountNumber: SOURCE_ACCOUNT }
        }
      }
    },
    digitalTaxCertificateSender: { taxpayer: SENDER_RFC },
    digitalTaxCertificate: { taxpayer: BENEFICIARY_RFC },
    receiver: {
      contract: {
        product: {
          debitCard: { interbankCode: clabe }
        }
      },
      name: beneficiaryName.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().slice(0, 40),
      bank: { financialEntityId: bankCode, name: bankCode }
    },
    transferAmount: { value: { amount: String(amount) } }
  })
}

// Consulta estado de una SPEI por sequenceReference
export const getSpeiStatus = async (sequenceReference, operationYear) => {
  const query = `typeReference=sequenceReference${operationYear ? `&operationYear=${operationYear}` : ''}`
  return bbvaRequest('GET', `/spei-transfers/${sequenceReference}/status?${query}`)
}

// Extrae el primer mensaje de error funcional de la respuesta de BBVA
export const bbvaErrorMessage = (data) => {
  const msgs = data?.messages || []
  const first = msgs[0]
  if (!first) return null
  const text = first.message || first.code || ''
  return text.includes('#') ? text.split('#').pop() : text
}
