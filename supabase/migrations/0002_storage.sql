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
