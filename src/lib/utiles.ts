/** Quita acentos y pasa a minúsculas para que la búsqueda no distinga "Queretaro" de "Querétaro". */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function claseNombres(...partes: Array<string | false | null | undefined>): string {
  return partes.filter(Boolean).join(' ')
}

export function urlComoLlegar(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

export function formatearHectareas(ha: number | null): string {
  if (ha == null) return '—'
  return `${new Intl.NumberFormat('es-MX').format(ha)} ha`
}
