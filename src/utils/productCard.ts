import type { Product } from '../data/products'

type ProductProfile = {
  label: string
  tone: string
  color: string
  refurbished: boolean
}

export function getProductProfile(product: Product): ProductProfile {
  const s = `${product.name} ${product.shortDescription}`.toLowerCase()

  const refurbished =
    s.includes('refurbished') ||
    s.includes('renoverad') ||
    s.includes('refurb')

  if (
    s.includes('pokemon') ||
    s.includes('pok\u00e9mon') ||
    s.includes('pok\u00c3\u00a9mon')
  ) {
    return { label: 'Pok\u00c3\u00a9mon-kort', tone: 'cards', color: 'var(--red)', refurbished }
  }
  if (
    s.includes('spel') ||
    s.includes('game') ||
    s.includes('zelda') ||
    s.includes('mario') ||
    s.includes('sonic') ||
    s.includes('snes') ||
    s.includes('nes ') ||
    s.includes('mega drive') ||
    s.includes('game boy')
  ) {
    return { label: 'Spel', tone: 'cards', color: 'var(--blue)', refurbished }
  }
  if (
    s.includes('konsol') ||
    s.includes('console') ||
    s.includes('nintendo') ||
    s.includes('playstation') ||
    s.includes('xbox') ||
    s.includes('sega') ||
    s.includes('n64') ||
    s.includes('switch')
  ) {
    return { label: refurbished ? 'Refurbished' : 'Konsoler', tone: 'console', color: refurbished ? 'var(--mint)' : 'var(--ink-2)', refurbished }
  }
  return { label: 'Spel & Konsoler', tone: 'drop', color: 'var(--ink-2)', refurbished }
}

export function getProductImagePath(product: Product, tone: string) {
  const cards = [
    '/shop-icons/pokemon-surging-sparks-booster-box.webp',
    '/shop-icons/pokemon-151-japansk-booster-box.webp',
    '/shop-icons/cynthias-garchump-ex-087-sar-raukcard-10-pokemon-kort.webp',
    '/shop-icons/simisear-214-vstar-universe-raukcard-10.webp',
  ]
  const consoles = [
    '/shop-icons/N64-Retro-Gaming-Console.webp',
    '/shop-icons/Nintendo64KontrollTredjepartOrange_8cc0d6a1-427d-4f0f-95c7-d0e65a8cd766.webp',
  ]
  const accessories = [
    '/shop-icons/img20260422_15443916.webp',
    '/shop-icons/wyf1f4xupwlelyxoksio.jpg',
  ]

  const source = tone === 'cards' ? cards : tone === 'console' ? consoles : accessories
  const seed = product.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return source[seed % source.length]
}
