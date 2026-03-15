# Supabase Setup

Esta carpeta contiene todo lo necesario para levantar la base de datos de la wiki en Supabase.

## Orden recomendado

1. Ejecutar las migraciones en `supabase/migrations/` en orden alfabético.
2. Ejecutar el seed de `supabase/seeds/0001_reference_data.sql`.
3. Crear la función de hook con `migrations/0004_auth_hook.sql`.
4. Configurar el hook `Custom Access Token` en Supabase para usar `public.custom_access_token_hook`.
5. Crear el bucket de imágenes con la migración incluida en `0003_storage.sql`.
6. Definir en la app `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y, para operaciones administrativas server-side, `SUPABASE_SERVICE_ROLE_KEY`.

## Estructura

- `migrations/0001_core_schema.sql`
  Crea extensiones, tipos, tablas, índices, trigger de `updated_at` y búsqueda full-text.
- `migrations/0002_rls.sql`
  Activa RLS y deja políticas base para anónimos, editores y admins.
- `migrations/0003_storage.sql`
  Crea el bucket `wiki-images` y sus políticas sobre `storage.objects`.
- `migrations/0004_auth_hook.sql`
  Copia `app_metadata.app_role` al claim JWT `app_role` para que lo lean las políticas RLS.
- `seeds/0001_reference_data.sql`
  Inserta categorías y eras base del proyecto.

## Rol esperado en JWT

Las políticas leen `auth.jwt() ->> 'app_role'`.

Valores esperados:

- `editor`
- `admin`

La fuente recomendada para ese valor es `app_metadata.app_role` en el usuario de Supabase Auth.

No uses `user_metadata` para permisos reales: la app lo tolera como fallback visual, pero las políticas RLS dependen del JWT.

Después de ejecutar la migración `0004_auth_hook.sql`, activa el hook en `Authentication > Hooks > Custom Access Token` y selecciona la función `public.custom_access_token_hook`.

## Notas

- `articles.status = 'published'` es visible para usuarios anónimos.
- `countries` y `country_scores` quedan restringidos a usuarios editor/admin hasta que se cierre la decisión funcional sobre exposición pública.
- `source_documents` existe para soportar el flujo de importación `.docx` antes de escribir en tablas de producción.
- Las rutas editoriales activas son `/admin/login`, `/admin/import`, `/admin/review` y `/admin/articles`.
- Si faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`, la app entra en bypass local para no bloquear desarrollo.
