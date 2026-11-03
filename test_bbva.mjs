import 'dotenv/config'
import { getBbvaToken, createSpeiTransfer, bbvaErrorMessage } from './api/_lib/bbva.js'

console.log('1) Probando token OAuth...')
try {
  const token = await getBbvaToken()
  console.log('   Token OK:', token.slice(0, 20) + '...')
} catch (e) {
  console.error('   FALLO token:', e.message)
  process.exit(1)
}

console.log('2) Probando firma en POST /spei-transfers (sandbox)...')
try {
  const r = await createSpeiTransfer({
    clabe: '012180015012345678',
    beneficiaryName: 'PRUEBA CASCARITA',
    amount: '10.00'
  })
  console.log('   HTTP', r.status)
  console.log('   Respuesta:', JSON.stringify(r.data).slice(0, 500))
  const err = bbvaErrorMessage(r.data)
  if (err) console.log('   Error funcional:', err)
} catch (e) {
  console.error('   FALLO request:', e.message)
}
