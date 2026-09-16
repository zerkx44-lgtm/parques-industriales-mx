import { useCallback, useEffect, useState } from 'react'

export type Tema = 'claro' | 'oscuro' | 'sistema'
const CLAVE = 'parques-tema'

function prefiereOscuro(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function aplicar(tema: Tema) {
  const oscuro = tema === 'oscuro' || (tema === 'sistema' && prefiereOscuro())
  document.documentElement.classList.toggle('oscuro', oscuro)
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', oscuro ? '#0E1720' : '#1B2A3A')
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(
    () => (localStorage.getItem(CLAVE) as Tema | null) ?? 'sistema',
  )

  useEffect(() => {
    aplicar(tema)
    localStorage.setItem(CLAVE, tema)
    // Si está en "sistema", seguimos los cambios del sistema operativo en vivo.
    if (tema !== 'sistema') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const alCambiar = () => aplicar('sistema')
    mq.addEventListener('change', alCambiar)
    return () => mq.removeEventListener('change', alCambiar)
  }, [tema])

  const alternar = useCallback(() => {
    setTema((actual) => {
      const efectivoOscuro = actual === 'oscuro' || (actual === 'sistema' && prefiereOscuro())
      return efectivoOscuro ? 'claro' : 'oscuro'
    })
  }, [])

  const esOscuro =
    tema === 'oscuro' ||
    (tema === 'sistema' && typeof window !== 'undefined' && prefiereOscuro())

  return { tema, setTema, alternar, esOscuro }
}
