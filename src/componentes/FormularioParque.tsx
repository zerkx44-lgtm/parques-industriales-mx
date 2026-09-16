import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { SECTORES, SERVICIOS, ETIQUETA_SECTOR, ETIQUETA_SERVICIO } from '../lib/tipos'
import type { Parque } from '../lib/tipos'
import { SelectorUbicacion } from './SelectorUbicacion'

/** Convierte "" en null para los campos opcionales de la base. */
const textoOpcional = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()

const esquema = z.object({
  nombre: z.string().trim().min(3, 'Escribe al menos 3 caracteres.'),
  municipio: z.string().trim().min(2, 'Escribe el municipio.'),
  estado: z.string().trim().min(2, 'Escribe el estado.'),
  sector: z.enum(SECTORES),
  servicios: z.array(z.enum(SERVICIOS)),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  hectareas: z
    .union([z.coerce.number().positive('Debe ser mayor a cero.'), z.literal('')])
    .transform((v) => (v === '' ? null : Number(v)))
    .nullable(),
  descripcion: textoOpcional,
  contacto_nombre: textoOpcional,
  contacto_telefono: textoOpcional,
  contacto_email: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine((v) => v === null || z.string().email().safeParse(v).success, 'Correo no válido.'),
  sitio_web: z
    .string()
    .trim()
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .refine((v) => v === null || z.string().url().safeParse(v).success, 'Debe empezar con http:// o https://'),
  foto_url: textoOpcional,
  activo: z.boolean(),
})

type Valores = z.input<typeof esquema>

interface Props {
  parque: Parque | null
  onListo: () => void
  onCancelar: () => void
}

export function FormularioParque({ parque, onListo, onCancelar }: Props) {
  const [subiendo, setSubiendo] = useState(false)

  const {
    register, handleSubmit, control, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    resolver: zodResolver(esquema) as never,
    defaultValues: {
      nombre: parque?.nombre ?? '',
      municipio: parque?.municipio ?? '',
      estado: parque?.estado ?? '',
      sector: parque?.sector ?? 'manufactura',
      servicios: parque?.servicios ?? [],
      lat: parque?.lat ?? 23.6,
      lng: parque?.lng ?? -102.5,
      hectareas: parque?.hectareas ?? '',
      descripcion: parque?.descripcion ?? '',
      contacto_nombre: parque?.contacto_nombre ?? '',
      contacto_telefono: parque?.contacto_telefono ?? '',
      contacto_email: parque?.contacto_email ?? '',
      sitio_web: parque?.sitio_web ?? '',
      foto_url: parque?.foto_url ?? '',
      activo: parque?.activo ?? true,
    } as Valores,
  })

  const lat = Number(watch('lat'))
  const lng = Number(watch('lng'))
  const fotoUrl = watch('foto_url')
  const servicios = watch('servicios') ?? []

  const subirFoto = async (archivo: File) => {
    setSubiendo(true)
    const extension = archivo.name.split('.').pop() ?? 'jpg'
    const ruta = `${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage
      .from('fotos-parques')
      .upload(ruta, archivo, { cacheControl: '3600', upsert: false })
    if (error) {
      toast.error(`No se pudo subir la foto: ${error.message}`)
    } else {
      const { data } = supabase.storage.from('fotos-parques').getPublicUrl(ruta)
      setValue('foto_url', data.publicUrl, { shouldDirty: true })
      toast.success('Foto subida.')
    }
    setSubiendo(false)
  }

  const guardar = handleSubmit(async (crudos) => {
    const datos = esquema.parse(crudos)
    const consulta = parque
      ? supabase.from('parques').update(datos).eq('id', parque.id)
      : supabase.from('parques').insert(datos)

    const { error } = await consulta
    if (error) {
      toast.error(
        error.message.includes('row-level security')
          ? 'Tu usuario no tiene permisos de administrador.'
          : error.message,
      )
      return
    }
    toast.success(parque ? 'Parque actualizado.' : 'Parque creado.')
    onListo()
  })

  return (
    <motion.form
      onSubmit={guardar}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre" error={errors.nombre?.message} className="sm:col-span-2">
          <input className="campo" {...register('nombre')} />
        </Campo>
        <Campo etiqueta="Municipio" error={errors.municipio?.message}>
          <input className="campo" {...register('municipio')} />
        </Campo>
        <Campo etiqueta="Estado" error={errors.estado?.message}>
          <input className="campo" {...register('estado')} />
        </Campo>
        <Campo etiqueta="Sector" error={errors.sector?.message}>
          <select className="campo" {...register('sector')}>
            {SECTORES.map((s) => (
              <option key={s} value={s}>{ETIQUETA_SECTOR[s]}</option>
            ))}
          </select>
        </Campo>
        <Campo etiqueta="Hectáreas" error={errors.hectareas?.message}>
          <input className="campo" type="number" step="any" {...register('hectareas')} />
        </Campo>
      </div>

      <Campo etiqueta="Servicios">
        <Controller
          control={control}
          name="servicios"
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {SERVICIOS.map((s) => {
                const activo = (field.value ?? []).includes(s)
                return (
                  <label
                    key={s}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activo
                        ? 'border-transparent bg-acero-800 text-white dark:bg-ambar dark:text-acero-950'
                        : 'border-acero-200 text-acero-600 dark:border-acero-700 dark:text-acero-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={activo}
                      onChange={() =>
                        field.onChange(
                          activo
                            ? (field.value ?? []).filter((x) => x !== s)
                            : [...(field.value ?? []), s],
                        )
                      }
                    />
                    {ETIQUETA_SERVICIO[s]}
                  </label>
                )
              })}
            </div>
          )}
        />
        <p className="mt-1 text-xs text-acero-400">{servicios.length} seleccionados</p>
      </Campo>

      <Campo etiqueta="Ubicación" error={errors.lat?.message ?? errors.lng?.message}>
        <div className="mb-2 grid grid-cols-2 gap-3">
          <input className="campo" type="number" step="any" placeholder="Latitud" aria-label="Latitud" {...register('lat')} />
          <input className="campo" type="number" step="any" placeholder="Longitud" aria-label="Longitud" {...register('lng')} />
        </div>
        <SelectorUbicacion
          lat={lat}
          lng={lng}
          onCambio={(la, ln) => {
            setValue('lat', la, { shouldDirty: true })
            setValue('lng', ln, { shouldDirty: true })
          }}
        />
      </Campo>

      <Campo etiqueta="Descripción" error={errors.descripcion?.message}>
        <textarea className="campo min-h-24" {...register('descripcion')} />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Contacto (nombre)" error={errors.contacto_nombre?.message}>
          <input className="campo" {...register('contacto_nombre')} />
        </Campo>
        <Campo etiqueta="Teléfono" error={errors.contacto_telefono?.message}>
          <input className="campo" {...register('contacto_telefono')} />
        </Campo>
        <Campo etiqueta="Correo" error={errors.contacto_email?.message}>
          <input className="campo" type="email" {...register('contacto_email')} />
        </Campo>
        <Campo etiqueta="Sitio web" error={errors.sitio_web?.message}>
          <input className="campo" placeholder="https://…" {...register('sitio_web')} />
        </Campo>
      </div>

      <Campo etiqueta="Foto" error={errors.foto_url?.message}>
        <div className="flex items-start gap-3">
          {fotoUrl && (
            <img src={fotoUrl} alt="Vista previa" className="size-20 shrink-0 rounded-lg object-cover" />
          )}
          <div className="flex-1 space-y-2">
            <input className="campo" placeholder="URL de la foto" {...register('foto_url')} />
            <input
              type="file"
              accept="image/*"
              disabled={subiendo}
              onChange={(e) => {
                const archivo = e.target.files?.[0]
                if (archivo) void subirFoto(archivo)
              }}
              className="block w-full text-xs text-acero-600 file:mr-3 file:rounded-lg file:border-0 file:bg-acero-800 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white dark:text-acero-400"
            />
            {subiendo && <p className="text-xs text-acero-400">Subiendo…</p>}
          </div>
        </div>
      </Campo>

      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" className="size-4 accent-[#F2B705]" {...register('activo')} />
        Visible en el buscador público
      </label>

      <div className="flex gap-2 border-t border-acero-200 pt-4 dark:border-acero-800">
        <button type="submit" disabled={isSubmitting || subiendo} className="btn-primario">
          {isSubmitting ? 'Guardando…' : parque ? 'Guardar cambios' : 'Crear parque'}
        </button>
        <button type="button" onClick={onCancelar} className="btn-fantasma">Cancelar</button>
      </div>
    </motion.form>
  )
}

function Campo({
  etiqueta, error, children, className,
}: {
  etiqueta: string
  error?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-acero-400">
        {etiqueta}
      </label>
      {children}
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
