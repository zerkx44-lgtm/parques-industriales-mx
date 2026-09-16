-- ============================================================
-- setup.sql — Archivo único para pegar en el SQL Editor de Supabase.
-- Contiene: esquema + RLS + storage + datos de muestra.
-- ============================================================

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

-- ============================================================
-- 0002_storage.sql — Bucket público para las fotos de parques
-- ============================================================

-- Bucket público: las URLs de las fotos se pueden abrir sin sesión.
insert into storage.buckets (id, name, public)
values ('fotos-parques', 'fotos-parques', true)
on conflict (id) do update set public = true;

-- Cualquiera puede VER las fotos (es un bucket público).
drop policy if exists fotos_lectura_publica on storage.objects;
create policy fotos_lectura_publica
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'fotos-parques');

-- Solo los admins pueden SUBIR archivos al bucket.
drop policy if exists fotos_insert_admin on storage.objects;
create policy fotos_insert_admin
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'fotos-parques' and public.es_admin());

-- Solo los admins pueden REEMPLAZAR archivos.
drop policy if exists fotos_update_admin on storage.objects;
create policy fotos_update_admin
  on storage.objects for update
  to authenticated
  using (bucket_id = 'fotos-parques' and public.es_admin())
  with check (bucket_id = 'fotos-parques' and public.es_admin());

-- Solo los admins pueden BORRAR archivos.
drop policy if exists fotos_delete_admin on storage.objects;
create policy fotos_delete_admin
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'fotos-parques' and public.es_admin());

-- ============================================================
-- seed.sql — 32 parques de muestra
-- Coordenadas aproximadas; datos ilustrativos para el demo.
-- Es idempotente: se puede correr varias veces sin duplicar.
-- ============================================================

delete from public.parques where nombre in (
  'Parque Industrial Querétaro','Parque Industrial Bernardo Quintana','Parque Aeroespacial de Querétaro',
  'Guanajuato Puerto Interior','Parque Industrial Castro del Río','Parque Industrial Amistad Bajío',
  'Parque Industrial San Francisco','Parque Industrial Tres Naciones','Logistik San Luis Potosí',
  'Interpuerto Monterrey','Parque Industrial Monterrey','Parque Industrial Escobedo',
  'Parque Industrial Aeropuerto','Parque Industrial Derramadero','Parque Industrial Ramos Arizpe',
  'Parque Industrial Antonio J. Bermúdez','Parque Industrial Las Américas','Parque Industrial Hermosillo',
  'Parque Industrial Pacífico','Parque Industrial PIMSA','Parque Industrial del Norte',
  'Parque Industrial Oradel','Parque Industrial El Salto','Guadalajara Technology Park',
  'Parque Industrial Toluca 2000','Parque Industrial Cuautitlán Izcalli','FINSA Puebla',
  'Ciudad Modelo San José Chiapa','Parque Industrial Ciudad Sahagún','Parque Industrial Xicohténcatl',
  'Parque Industrial Bruno Pagliai','Parque Industrial Yucatán'
);

insert into public.parques
  (nombre, municipio, estado, sector, servicios, lat, lng, hectareas, descripcion,
   contacto_nombre, contacto_telefono, contacto_email, sitio_web) values
('Parque Industrial Querétaro','Querétaro','Querétaro','manufactura','{gas_natural,subestacion,tratamiento_agua,ferrocarril}',20.78,-100.44,650,'Uno de los desarrollos industriales más consolidados del Bajío, con conexión ferroviaria directa y planta propia de tratamiento de agua.','Dirección Comercial','442 100 0001','contacto@piq.mx','https://ejemplo.mx/piq'),
('Parque Industrial Bernardo Quintana','El Marqués','Querétaro','manufactura','{gas_natural,subestacion}',20.63,-100.33,430,'Parque de manufactura ligera y media sobre el corredor El Marqués, con acceso rápido a la carretera 57.','Dirección Comercial','442 100 0002','contacto@pibq.mx','https://ejemplo.mx/pibq'),
('Parque Aeroespacial de Querétaro','Colón','Querétaro','aeroespacial','{subestacion,tratamiento_agua}',20.62,-100.19,280,'Clúster aeroespacial contiguo al Aeropuerto Intercontinental de Querétaro, orientado a manufactura y MRO.','Dirección Comercial','442 100 0003','contacto@aeroqro.mx','https://ejemplo.mx/aeroqro'),
('Guanajuato Puerto Interior','Silao','Guanajuato','logistica','{aduana,ferrocarril,gas_natural,subestacion,tratamiento_agua}',20.95,-101.43,1200,'Plataforma logística multimodal con aduana interior, terminal ferroviaria y aeropuerto de carga en el mismo recinto.','Dirección Comercial','472 100 0004','contacto@gpi.mx','https://ejemplo.mx/gpi'),
('Parque Industrial Castro del Río','Irapuato','Guanajuato','automotriz','{gas_natural,subestacion}',20.70,-101.36,520,'Enfocado a proveeduría automotriz Tier 1 y Tier 2 en el corredor Irapuato–Silao.','Dirección Comercial','462 100 0005','contacto@castrodelrio.mx','https://ejemplo.mx/castrodelrio'),
('Parque Industrial Amistad Bajío','Celaya','Guanajuato','automotriz','{subestacion,tratamiento_agua}',20.54,-100.78,310,'Naves industriales listas para operar dirigidas a proveedores del sector automotriz.','Dirección Comercial','461 100 0006','contacto@amistadbajio.mx','https://ejemplo.mx/amistadbajio'),
('Parque Industrial San Francisco','San Francisco de los Romo','Aguascalientes','automotriz','{ferrocarril,gas_natural,subestacion}',21.97,-102.27,400,'Ubicado en el corredor automotriz de Aguascalientes, con espuela de ferrocarril propia.','Dirección Comercial','449 100 0007','contacto@pisf.mx','https://ejemplo.mx/pisf'),
('Parque Industrial Tres Naciones','San Luis Potosí','San Luis Potosí','manufactura','{gas_natural,subestacion}',22.10,-100.87,290,'Parque urbano de manufactura con buena disponibilidad de mano de obra calificada.','Dirección Comercial','444 100 0008','contacto@tresnaciones.mx','https://ejemplo.mx/tresnaciones'),
('Logistik San Luis Potosí','Villa de Reyes','San Luis Potosí','logistica','{aduana,ferrocarril,subestacion}',21.94,-100.88,780,'Zona logística con recinto fiscalizado estratégico y patio intermodal.','Dirección Comercial','444 100 0009','contacto@logistikslp.mx','https://ejemplo.mx/logistikslp'),
('Interpuerto Monterrey','Salinas Victoria','Nuevo León','logistica','{aduana,ferrocarril,gas_natural,subestacion}',25.93,-100.28,1000,'Puerto interior del noreste con aduana, terminal intermodal y conexión directa a Laredo.','Dirección Comercial','81 1000 0010','contacto@interpuerto.mx','https://ejemplo.mx/interpuerto'),
('Parque Industrial Monterrey','Apodaca','Nuevo León','manufactura','{gas_natural,subestacion,tratamiento_agua}',25.78,-100.20,560,'Parque maduro en Apodaca con servicios completos y alta ocupación.','Dirección Comercial','81 1000 0011','contacto@pimty.mx','https://ejemplo.mx/pimty'),
('Parque Industrial Escobedo','General Escobedo','Nuevo León','electronica','{gas_natural,subestacion}',25.80,-100.33,340,'Orientado a electrónica y electrodomésticos, con acceso al anillo periférico.','Dirección Comercial','81 1000 0012','contacto@piescobedo.mx','https://ejemplo.mx/piescobedo'),
('Parque Industrial Aeropuerto','Apodaca','Nuevo León','aeroespacial','{subestacion,tratamiento_agua}',25.77,-100.13,220,'Contiguo al Aeropuerto Internacional de Monterrey, con vocación aeroespacial y de carga aérea.','Dirección Comercial','81 1000 0013','contacto@piaeropuerto.mx','https://ejemplo.mx/piaeropuerto'),
('Parque Industrial Derramadero','Saltillo','Coahuila','automotriz','{ferrocarril,gas_natural,subestacion}',25.28,-101.25,900,'Corredor automotriz de Saltillo, sede de armadoras y su cadena de proveeduría.','Dirección Comercial','844 100 0014','contacto@derramadero.mx','https://ejemplo.mx/derramadero'),
('Parque Industrial Ramos Arizpe','Ramos Arizpe','Coahuila','automotriz','{ferrocarril,gas_natural,subestacion,tratamiento_agua}',25.55,-100.95,750,'Uno de los polos automotrices más grandes del país, con infraestructura ferroviaria consolidada.','Dirección Comercial','844 100 0015','contacto@piramos.mx','https://ejemplo.mx/piramos'),
('Parque Industrial Antonio J. Bermúdez','Ciudad Juárez','Chihuahua','electronica','{aduana,gas_natural,subestacion}',31.72,-106.43,480,'Parque maquilador histórico de Ciudad Juárez, a minutos de los puentes internacionales.','Dirección Comercial','656 100 0016','contacto@bermudez.mx','https://ejemplo.mx/bermudez'),
('Parque Industrial Las Américas','Chihuahua','Chihuahua','aeroespacial','{gas_natural,subestacion}',28.60,-106.10,360,'Concentra empresas aeroespaciales y de manufactura de precisión.','Dirección Comercial','614 100 0017','contacto@lasamericas.mx','https://ejemplo.mx/lasamericas'),
('Parque Industrial Hermosillo','Hermosillo','Sonora','automotriz','{ferrocarril,subestacion}',29.02,-111.00,600,'Polo automotriz del noroeste con conexión ferroviaria hacia Nogales y Guaymas.','Dirección Comercial','662 100 0018','contacto@pihmo.mx','https://ejemplo.mx/pihmo'),
('Parque Industrial Pacífico','Tijuana','Baja California','electronica','{aduana,subestacion,tratamiento_agua}',32.55,-116.93,250,'Manufactura electrónica y dispositivos médicos a pocos kilómetros de la garita Otay.','Dirección Comercial','664 100 0019','contacto@pipacifico.mx','https://ejemplo.mx/pipacifico'),
('Parque Industrial PIMSA','Mexicali','Baja California','aeroespacial','{aduana,gas_natural,subestacion}',32.62,-115.40,420,'Desarrollo de naves clase A en Mexicali, con fuerte presencia aeroespacial.','Dirección Comercial','686 100 0020','contacto@pimsa.mx','https://ejemplo.mx/pimsa'),
('Parque Industrial del Norte','Reynosa','Tamaulipas','electronica','{aduana,gas_natural,subestacion}',26.08,-98.30,380,'Maquila electrónica en la frontera con McAllen, Texas.','Dirección Comercial','899 100 0021','contacto@pinorte.mx','https://ejemplo.mx/pinorte'),
('Parque Industrial Oradel','Nuevo Laredo','Tamaulipas','logistica','{aduana,ferrocarril,subestacion}',27.45,-99.55,540,'Centro logístico en el cruce comercial más importante de México hacia Estados Unidos.','Dirección Comercial','867 100 0022','contacto@oradel.mx','https://ejemplo.mx/oradel'),
('Parque Industrial El Salto','El Salto','Jalisco','electronica','{ferrocarril,gas_natural,subestacion}',20.52,-103.20,470,'Corredor industrial de El Salto, base de la industria electrónica de Jalisco.','Dirección Comercial','33 1000 0023','contacto@pielsalto.mx','https://ejemplo.mx/pielsalto'),
('Guadalajara Technology Park','Zapopan','Jalisco','electronica','{subestacion,tratamiento_agua}',20.77,-103.43,180,'Campus tecnológico enfocado a diseño electrónico, software y manufactura avanzada.','Dirección Comercial','33 1000 0024','contacto@gdltech.mx','https://ejemplo.mx/gdltech'),
('Parque Industrial Toluca 2000','Toluca','Estado de México','automotriz','{gas_natural,subestacion,tratamiento_agua}',19.33,-99.58,700,'Uno de los parques más grandes del centro del país, con vocación automotriz y de autopartes.','Dirección Comercial','722 100 0025','contacto@toluca2000.mx','https://ejemplo.mx/toluca2000'),
('Parque Industrial Cuautitlán Izcalli','Cuautitlán Izcalli','Estado de México','logistica','{ferrocarril,subestacion}',19.66,-99.21,320,'Nodo de distribución para el área metropolitana del Valle de México.','Dirección Comercial','55 1000 0026','contacto@picuautitlan.mx','https://ejemplo.mx/picuautitlan'),
('FINSA Puebla','Cuautlancingo','Puebla','automotriz','{gas_natural,subestacion,tratamiento_agua}',19.10,-98.26,410,'Parque de proveeduría automotriz junto al complejo armador de Puebla.','Dirección Comercial','222 100 0027','contacto@finsapuebla.mx','https://ejemplo.mx/finsapuebla'),
('Ciudad Modelo San José Chiapa','San José Chiapa','Puebla','automotriz','{ferrocarril,subestacion,tratamiento_agua}',19.24,-97.80,1100,'Desarrollo planeado alrededor de una armadora premium, con infraestructura nueva.','Dirección Comercial','222 100 0028','contacto@ciudadmodelo.mx','https://ejemplo.mx/ciudadmodelo'),
('Parque Industrial Ciudad Sahagún','Tepeapulco','Hidalgo','manufactura','{ferrocarril,gas_natural,subestacion}',19.77,-98.58,600,'Complejo histórico de manufactura pesada y material ferroviario.','Dirección Comercial','791 100 0029','contacto@sahagun.mx','https://ejemplo.mx/sahagun'),
('Parque Industrial Xicohténcatl','Tetla','Tlaxcala','manufactura','{gas_natural,subestacion}',19.43,-98.10,260,'Parque de manufactura textil y metalmecánica en el corredor Tlaxcala–Apizaco.','Dirección Comercial','246 100 0030','contacto@xicohtencatl.mx','https://ejemplo.mx/xicohtencatl'),
('Parque Industrial Bruno Pagliai','Veracruz','Veracruz','logistica','{aduana,ferrocarril,subestacion}',19.15,-96.19,500,'Ligado al Puerto de Veracruz, con vocación logística y siderúrgica.','Dirección Comercial','229 100 0031','contacto@brunopagliai.mx','https://ejemplo.mx/brunopagliai'),
('Parque Industrial Yucatán','Umán','Yucatán','manufactura','{subestacion,tratamiento_agua}',20.88,-89.74,340,'Principal parque manufacturero del sureste, con costos competitivos y baja rotación.','Dirección Comercial','999 100 0032','contacto@piyucatan.mx','https://ejemplo.mx/piyucatan');
