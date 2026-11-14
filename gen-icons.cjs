const sharp = require('sharp')
const fs = require('fs')

const BG = '#0B0B0B'
const svg = fs.readFileSync('public/logo_cascarita.svg')

async function make(size, padPct, out) {
  const pad = Math.round(size * padPct)
  const inner = size - pad * 2
  const logo = await sharp(svg, { density: 96 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  await sharp({ create: { width: size, height: size, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(`public/${out}`)
  console.log('created', out)
}

async function main() {
  await make(192, 0.12, 'pwa-192.png')
  await make(512, 0.12, 'pwa-512.png')
  await make(512, 0.22, 'pwa-maskable-512.png')
  await make(180, 0.12, 'apple-touch-icon.png')
}
main().catch(e => { console.error(e); process.exit(1) })
