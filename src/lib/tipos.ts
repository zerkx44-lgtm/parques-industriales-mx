export const SECTORES = ['automotriz', 'logistica', 'manufactura', 'aeroespacial', 'electronica'] as const
export type Sector = (typeof SECTORES)[number]

export const SERVICIOS = ['aduana', 'ferrocarril', 'gas_natural', 'subestacion', 'tratamiento_agua'] as const
export type Servicio = (typeof SERVICIOS)[number]

export interface Parque {
  id: string
  nombre: string
  municipio: string
  estado: string
  sector: Sector
  servicios: Servicio[]
  lat: number
  lng: number
  hectareas: number | null
  descripcion: string | null
  contacto_nombre: string | null
  contacto_telefono: string | null
  contacto_email: string | null
  sitio_web: string | null
  foto_url: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

/** Lo que se envía al crear o editar (sin campos que genera la base). */
export type ParqueEntrada = Omit<Parque, 'id' | 'created_at' | 'updated_at'>

export const ETIQUETA_SECTOR: Record<Sector, string> = {
  automotriz: 'Automotriz',
  logistica: 'Logística',
  manufactura: 'Manufactura',
  aeroespacial: 'Aeroespacial',
  electronica: 'Electrónica',
}

export const COLOR_SECTOR: Record<Sector, string> = {
  automotriz: '#2F6FDE',
  logistica: '#0E9F6E',
  manufactura: '#C2410C',
  aeroespacial: '#7C3AED',
  electronica: '#DB2777',
}

export const ETIQUETA_SERVICIO: Record<Servicio, string> = {
  aduana: 'Aduana',
  ferrocarril: 'Ferrocarril',
  gas_natural: 'Gas natural',
  subestacion: 'Subestación eléctrica',
  tratamiento_agua: 'Tratamiento de agua',
}

export const ICONO_SERVICIO: Record<Servicio, string> = {
  aduana: '🛃',
  ferrocarril: '🚆',
  gas_natural: '🔥',
  subestacion: '⚡',
  tratamiento_agua: '💧',
}
