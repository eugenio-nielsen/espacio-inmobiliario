# Deploy en Vercel

## Variables de entorno requeridas

En Vercel → Project → Settings → Environment Variables, agregá:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key de Supabase |
| `NEXT_PUBLIC_SITE_URL` | `https://espacioinmobiliario.com.ar` |

## Pasos para deployar

1. Subir el proyecto a GitHub (repositorio privado recomendado)
2. En vercel.com → "Add New Project" → importar el repositorio
3. Agregar las 4 variables de entorno
4. Click en "Deploy"

## Dominio personalizado

1. En Vercel → Project → Settings → Domains
2. Agregar `espacioinmobiliario.com.ar` y `www.espacioinmobiliario.com.ar`
3. Configurar los registros DNS según indique Vercel (generalmente un registro A o CNAME)
4. Una vez activo el dominio, actualizar `NEXT_PUBLIC_SITE_URL` en Vercel

## Supabase: habilitar URL del sitio en producción

En Supabase → Authentication → URL Configuration:
- **Site URL**: `https://espacioinmobiliario.com.ar`
- **Redirect URLs**: agregar `https://espacioinmobiliario.com.ar/**`
