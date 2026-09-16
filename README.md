# Parques Industriales MX

Buscador de parques industriales de México: mapa, filtros, ficha técnica de cada
parque y un panel de administración para mantener el directorio.

- **Vista pública** (`/`): buscador, filtros por estado, sector y servicios, mapa
  con agrupación de marcadores y ficha de cada parque en `/parque/:id`.
- **Administración** (`/admin`): login, alta/edición/eliminación de parques,
  subida de fotos y activar/desactivar sin borrar.
- **PWA**: se puede instalar en el celular y guarda los mosaicos del mapa en caché.

## Stack

Vite · React · TypeScript · Tailwind CSS v4 · Framer Motion · react-leaflet
(OpenStreetMap, sin API key) · Supabase (base de datos, autenticación y storage)
· React Router · zod + react-hook-form · vite-plugin-pwa.

---

## 1. Correr en local

```bash
npm install
cp .env.example .env   # y llena los dos valores
npm run dev
```

Abre http://localhost:5173

Otros comandos:

```bash
npm run build      # compila TypeScript y genera dist/
npm run preview    # sirve dist/ como si fuera producción
```

## 2. Variables de entorno

Van en un archivo `.env` en la raíz (ya está en `.gitignore`, **no se sube al repo**):

| Variable | Dónde se consigue |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` / `public` |

**Importante:** la llave `anon` es pública por diseño — viaja al navegador y no
es un secreto. Lo que protege los datos no es la llave, sino las políticas RLS
de la base (ver abajo). La llave **`service_role` nunca** debe estar en el
frontend ni en el repositorio: esa sí se salta todas las políticas.

Todo lo que empieza con `VITE_` queda incrustado en el JavaScript compilado.
Nunca pongas ahí nada que deba permanecer secreto.

## 3. Preparar la base de datos

Ya está aplicada en el proyecto de Supabase de este demo. Para replicarla en
otro proyecto:

1. Supabase → **SQL Editor** → New query.
2. Pega el contenido de [`supabase/setup.sql`](supabase/setup.sql) y ejecútalo.
   Ese archivo contiene, en orden: tablas, índices, trigger, políticas RLS,
   bucket de fotos y los 32 parques de muestra.
3. Listo. Las migraciones sueltas están en `supabase/migrations/` por si
   prefieres usar el CLI de Supabase.

### Qué es RLS, en corto

*Row Level Security* es un candado a nivel de fila en Postgres. Cuando está
activo, **ninguna** fila se puede leer ni escribir salvo que exista una política
que lo permita. Las de este proyecto:

| Quién | Puede |
| --- | --- |
| Visitante sin sesión (`anon`) | Leer únicamente parques con `activo = true` |
| Usuario con sesión | Leer todos los parques (incluidos los ocultos) |
| Usuario en la tabla `admins` | Crear, editar y eliminar parques; subir y borrar fotos |

Por eso el panel de administración es seguro aunque el código viaje al
navegador: si alguien intenta escribir sin ser admin, **la base de datos** lo
rechaza, no el frontend.

## 4. Crear el primer administrador

Son dos pasos: crear el usuario y luego marcarlo como admin.

1. **Crear el usuario**
   Supabase → **Authentication** → **Users** → *Add user* → *Create new user*.
   Pon el correo y una contraseña, y marca *Auto Confirm User* para no tener que
   confirmar por correo.

2. **Marcarlo como admin**
   Supabase → **SQL Editor**, y ejecuta (cambiando el correo):

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'tucorreo@empresa.mx'
   on conflict do nothing;
   ```

3. Entra a `/admin` con ese correo y contraseña.

Para agregar más administradores después, repite los dos pasos. Para quitar a
alguien:

```sql
delete from public.admins
where user_id = (select id from auth.users where email = 'excorreo@empresa.mx');
```

Quitarlo de `admins` le deja la cuenta pero le retira los permisos de escritura.

## 5. Desplegar

### Opción A — Vercel (lo más rápido)

1. Sube el proyecto a un repositorio de GitHub.
2. En Vercel: *Add New* → *Project* → importa el repo.
3. Vercel detecta Vite solo. Confirma:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. En **Settings → Environment Variables** agrega `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY` (para Production, Preview y Development).
5. *Deploy*.

El archivo [`vercel.json`](vercel.json) ya incluye la reescritura que evita que
`/parque/:id` y `/admin` den 404 al recargar la página.

> Si cambias una variable de entorno, hay que **volver a desplegar**: los valores
> se incrustan al compilar, no se leen en vivo.

### Opción B — VPS con Nginx

En tu máquina:

```bash
npm run build
rsync -avz --delete dist/ usuario@TU_IP:/var/www/parques/
```

En el servidor (Ubuntu/Debian):

```bash
sudo apt update && sudo apt install -y nginx
sudo mkdir -p /var/www/parques && sudo chown -R $USER:$USER /var/www/parques

# Copia despliegue/nginx.conf y cambia server_name por tu dominio
sudo cp nginx.conf /etc/nginx/sites-available/parques
sudo ln -s /etc/nginx/sites-available/parques /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t          # revisa que la configuración sea válida
sudo systemctl reload nginx
```

La línea que importa en esa configuración es:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

React Router maneja las rutas en el navegador; el servidor no tiene una carpeta
`/parque/abc`. Esa línea le dice a Nginx: *"si el archivo no existe, entrega
index.html"* — y así la app se encarga. Sin ella, recargar cualquier ruta que no
sea `/` devuelve 404.

**HTTPS con Certbot** (necesario: sin HTTPS el service worker de la PWA no
funciona y el navegador no ofrece instalar la app):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d parques.tudominio.mx
```

Certbot edita solo la configuración de Nginx y renueva el certificado de forma
automática. Comprueba la renovación con:

```bash
sudo certbot renew --dry-run
```

Para actualizar la app después de un cambio: `npm run build` y vuelve a copiar
`dist/`.

## 6. Estructura del proyecto

```
src/
  componentes/     Piezas de interfaz reutilizables (mapa, chips, ficha, formulario)
  hooks/           Lógica compartida: datos, filtros en la URL, sesión, tema
  lib/             Cliente de Supabase, tipos y utilidades
  paginas/         Publico, Admin y Login
supabase/
  migrations/      SQL por pasos (para el CLI de Supabase)
  seed.sql         Los 32 parques de muestra
  setup.sql        Todo junto, para pegar en el SQL Editor
despliegue/
  nginx.conf       Configuración lista para el VPS
```

## 7. Notas

- Los datos de los 32 parques son **de muestra** y las coordenadas son
  aproximadas: sirven para el demo, no como fuente oficial.
- El mapa usa mosaicos de OpenStreetMap, gratuitos y sin API key. Si el tráfico
  crece mucho conviene pasar a un proveedor de mosaicos con plan propio.
- La app respeta `prefers-reduced-motion`: si el sistema pide menos animación,
  las transiciones se desactivan.

---

Desplegado automáticamente en Vercel con cada push a `main`.
