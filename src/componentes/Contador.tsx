import { useEffect, useRef, useState } from 'react'

/** Cuenta desde el valor anterior hasta el nuevo con una animación corta. */
export function Contador({ valor }: { valor: number }) {
  const [mostrado, setMostrado] = useState(valor)
  const anterior = useRef(valor)

  useEffect(() => {
    const desde = anterior.current
    anterior.current = valor
    if (desde === valor) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMostrado(valor)
      return
    }
    const inicio = performance.now()
    const dur = 380
    let raf = 0
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / dur)
      const suave = 1 - Math.pow(1 - p, 3)
      setMostrado(Math.round(desde + (valor - desde) * suave))
      if (p < 1) raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [valor])

  return <span className="tabular-nums">{mostrado}</span>
}
