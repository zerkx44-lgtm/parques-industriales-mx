-- ============================================================
-- 0001_parques.sql — Esquema base, índices y RLS
-- ============================================================

-- gen_random_uuid() vive en pgcrypto (ya viene habilitado en Supabase).
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Tabla de administradores.
-- Guarda qué usuarios de Supabase Auth pueden escribir.
-- Si tu user_id no está aquí, solo puedes leer.
-- ------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabla principal de parques industriales.
-- ------------------------------------------------------------
create table if not exists public.parques (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  municipio text not null,
  estado text not null,
  sector text not null check (sector in ('automotriz','logistica','manufactura','aeroespacial','electronica')),
  servicios text[] not null default '{}',
  lat double precision not null,
  lng double precision not null,
  hectareas numeric,
  descripcion text,
  contacto_nombre text,
  contacto_telefono text,
  contacto_email text,
  sitio_web text,
  foto_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Solo se aceptan servicios de la lista permitida (array vacío también es válido).
alter table public.parques drop constraint if exists parques_servicios_validos;
alter table public.parques add constraint parques_servicios_validos
  check (servicios <@ array['aduana','ferrocarril','gas_natural','subestacion','tratamiento_agua']::text[]);

-- Índices: los dos filtros más usados + GIN para buscar dentro del array de servicios.
create index if not exists parques_estado_idx on public.parques (estado);
create index if not exists parques_sector_idx on public.parques (sector);
create index if not exists parques_servicios_idx on public.parques using gin (servicios);
create index if not exists parques_activo_idx on public.parques (activo);

-- ------------------------------------------------------------
-- Trigger: cada UPDATE refresca updated_at automáticamente.
-- ------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists parques_set_updated_at on public.parques;
create trigger parques_set_updated_at
  before update on public.parques
  for each row execute function public.tg_set_updated_at();

-- ------------------------------------------------------------
-- Helper: ¿el usuario actual es admin?
-- SECURITY DEFINER para que la política pueda leer public.admins
-- sin que el propio usuario necesite permiso directo sobre esa tabla
-- (y así evitamos recursión entre políticas).
-- ------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ============================================================
-- RLS (Row Level Security)
-- Con RLS activo, ninguna fila es visible/escribible salvo que
-- una política lo permita explícitamente.
-- ============================================================
alter table public.parques enable row level security;
alter table public.admins  enable row level security;

-- Cualquier visitante (rol anon) puede LEER, pero solo parques activos.
drop policy if exists parques_lectura_publica on public.parques;
create policy parques_lectura_publica
  on public.parques for select
  to anon
  using (activo = true);

-- Un usuario con sesión iniciada ve TODO (incluidos los desactivados),
-- porque el panel de administración necesita listarlos para reactivarlos.
drop policy if exists parques_lectura_autenticados on public.parques;
create policy parques_lectura_autenticados
  on public.parques for select
  to authenticated
  using (true);

-- Escritura (insert / update / delete): solo admins.
drop policy if exists parques_insert_admin on public.parques;
create policy parques_insert_admin
  on public.parques for insert
  to authenticated
  with check (public.es_admin());

drop policy if exists parques_update_admin on public.parques;
create policy parques_update_admin
  on public.parques for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

drop policy if exists parques_delete_admin on public.parques;
create policy parques_delete_admin
  on public.parques for delete
  to authenticated
  using (public.es_admin());

-- Cada usuario puede comprobar si él mismo está en la tabla admins.
-- Nadie puede escribir en admins desde la app: se hace desde el SQL Editor.
drop policy if exists admins_lectura_propia on public.admins;
create policy admins_lectura_propia
  on public.admins for select
  to authenticated
  using (user_id = auth.uid());
