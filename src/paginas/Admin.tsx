import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Encabezado } from '../componentes/Encabezado'
import { FormularioParque } from '../componentes/FormularioParque'
import { EsqueletoLista } from '../componentes/Esqueletos'
import { Login } from './Login'
import { useSesion } from '../hooks/useSesion'
import { useParques } from '../hooks/useParques'
import { supabase } from '../lib/supabase'
import { ETIQUETA_SECTOR, COLOR_SECTOR, type Parque } from '../lib/tipos'
import { normalizar } from '../lib/utiles'

export function Admin() {
  const { sesion, esAdmin, cargando: cargandoSesion } = useSesion()

  if (cargandoSesion) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-acero-400">Cargando…</div>
    )
  }

  if (!sesion) return <Login />

  if (!esAdmin) {
    return (
      <div className="flex min-h-dvh flex-col">
        <Encabezado />
        <main className="grid flex-1 place-items-center p-6 text-center">
          <div className="tarjeta max-w-md space-y-3 p-6">
            <p className="text-4xl" aria-hidden>🔒</p>
            <h1 className="text-xl font-extrabold text-acero-800 dark:text-white">
              Tu cuenta no es administradora
            </h1>
            <p className="text-sm text-acero-600 dark:text-acero-400">
              Iniciaste sesión como <strong>{sesion.user.email}</strong>, pero ese usuario no está
              en la tabla <code className="rounded bg-acero-200/60 px-1 dark:bg-acero-800">admins</code>.
              Pide que te agreguen desde el SQL Editor de Supabase.
            </p>
            <div className="flex justify-center gap-2">
              <button onClick={() => supabase.auth.signOut()} className="btn-fantasma">Cerrar sesión</button>
              <Link to="/" className="btn-primario">Ver el mapa</Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return <PanelAdmin correo={sesion.user.email ?? ''} />
}

function PanelAdmin({ correo }: { correo: string }) {
  const { parques, cargando, error, recargar } = useParques({ incluirInactivos: true })
  const [busqueda, setBusqueda] = useState('')
  const [editando, setEditando] = useState<Parque | null>(null)
  const [creando, setCreando] = useState(false)
  const [porBorrar, setPorBorrar] = useState<Parque | null>(null)

  const filtrados = useMemo(() => {
    const q = normalizar(busqueda)
    if (!q) return parques
    return parques.filter((p) =>
      normalizar(`${p.nombre} ${p.municipio} ${p.estado}`).includes(q),
    )
  }, [parques, busqueda])

  const alternarActivo = async (p: Parque) => {
    const { error: err } = await supabase
      .from('parques')
      .update({ activo: !p.activo })
      .eq('id', p.id)
    if (err) toast.error(err.message)
    else {
      toast.success(p.activo ? 'Parque desactivado.' : 'Parque activado.')
      void recargar()
    }
  }

  const borrar = async () => {
    if (!porBorrar) return
    const { error: err } = await supabase.from('parques').delete().eq('id', porBorrar.id)
    if (err) toast.error(err.message)
    else {
      toast.success('Parque eliminado.')
      void recargar()
    }
    setPorBorrar(null)
  }

  const cerrarFormulario = () => { setEditando(null); setCreando(false) }
  const formularioAbierto = creando || editando !== null

  return (
    <div className="flex min-h-dvh flex-col">
      <Encabezado
        accion={
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-acero-400 sm:inline">{correo}</span>
            <Link to="/" className="btn-fantasma text-xs">Ver mapa</Link>
            <button onClick={() => supabase.auth.signOut()} className="btn-fantasma text-xs">
              Salir
            </button>
          </div>
        }
      />

      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {formularioAbierto ? (
            <motion.section key="form" exit={{ opacity: 0 }} className="tarjeta p-5 sm:p-6">
              <h1 className="mb-5 text-2xl font-extrabold tracking-tight text-acero-800 dark:text-white">
                {editando ? 'Editar parque' : 'Nuevo parque'}
              </h1>
              <FormularioParque
                parque={editando}
                onCancelar={cerrarFormulario}
                onListo={() => { cerrarFormulario(); void recargar() }}
              />
            </motion.section>
          ) : (
            <motion.section key="tabla" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-acero-800 dark:text-white">
                    Parques
                  </h1>
                  <p className="text-sm text-acero-600 dark:text-acero-400">
                    {parques.length} registrados · {parques.filter((p) => p.activo).length} visibles al público
                  </p>
                </div>
                <button onClick={() => setCreando(true)} className="btn-primario">+ Nuevo parque</button>
              </div>

              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, municipio o estado…"
                aria-label="Buscar parques"
                className="campo mb-4 max-w-md"
              />

              {cargando ? (
                <EsqueletoLista cantidad={6} />
              ) : error ? (
                <div className="tarjeta p-6 text-center">
                  <p className="font-bold text-acero-800 dark:text-white">Error al cargar</p>
                  <p className="mt-1 text-sm text-acero-600 dark:text-acero-400">{error}</p>
                  <button onClick={recargar} className="btn-primario mt-3">Reintentar</button>
                </div>
              ) : filtrados.length === 0 ? (
                <div className="tarjeta p-10 text-center text-sm text-acero-600 dark:text-acero-400">
                  No hay parques que coincidan con la búsqueda.
                </div>
              ) : (
                <div className="tarjeta overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead className="border-b border-acero-200 text-left text-xs uppercase tracking-wider text-acero-400 dark:border-acero-800">
                      <tr>
                        <th className="px-4 py-3 font-bold">Nombre</th>
                        <th className="px-4 py-3 font-bold">Ubicación</th>
                        <th className="px-4 py-3 font-bold">Sector</th>
                        <th className="px-4 py-3 font-bold">Estado</th>
                        <th className="px-4 py-3 text-right font-bold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtrados.map((p) => (
                        <tr key={p.id} className="border-b border-acero-200/60 last:border-0 dark:border-acero-800">
                          <td className="px-4 py-3 font-semibold text-acero-800 dark:text-white">{p.nombre}</td>
                          <td className="px-4 py-3 text-acero-600 dark:text-acero-400">{p.municipio}, {p.estado}</td>
                          <td className="px-4 py-3">
                            <span
                              className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                              style={{ backgroundColor: COLOR_SECTOR[p.sector] }}
                            >
                              {ETIQUETA_SECTOR[p.sector]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={p.activo ? 'font-semibold text-emerald-600' : 'text-acero-400'}>
                              {p.activo ? 'Activo' : 'Oculto'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1.5">
                              <button onClick={() => setEditando(p)} className="btn-fantasma px-2.5 py-1 text-xs">Editar</button>
                              <button onClick={() => alternarActivo(p)} className="btn-fantasma px-2.5 py-1 text-xs">
                                {p.activo ? 'Desactivar' : 'Activar'}
                              </button>
                              <button onClick={() => setPorBorrar(p)} className="btn-peligro px-2.5 py-1 text-xs">Eliminar</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Confirmación de borrado */}
      <AnimatePresence>
        {porBorrar && (
          <>
            <motion.div
              className="fixed inset-0 z-[1200] bg-acero-950/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPorBorrar(null)}
            />
            <motion.div
              role="alertdialog" aria-modal="true"
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="fixed left-1/2 top-1/2 z-[1201] w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-6 shadow-2xl dark:bg-acero-900"
            >
              <h2 className="text-lg font-extrabold text-acero-800 dark:text-white">¿Eliminar parque?</h2>
              <p className="mt-2 text-sm text-acero-600 dark:text-acero-400">
                Vas a eliminar <strong>{porBorrar.nombre}</strong> de forma permanente.
                Si solo quieres ocultarlo del buscador, usa «Desactivar».
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setPorBorrar(null)} className="btn-fantasma">Cancelar</button>
                <button onClick={borrar} className="btn-peligro">Sí, eliminar</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
