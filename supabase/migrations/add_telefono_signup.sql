-- ============================================================
-- Migración: guardar el teléfono al crear el perfil
-- Correr en: Supabase Dashboard → SQL Editor
-- IMPORTANTE: correr ANTES de deployar el código que la usa.
--
-- El trigger creaba el perfil copiando solo nombre y email, así que
-- el teléfono que se enviaba en la metadata del signUp se perdía.
-- Resultado: ningún perfil llegó a tener teléfono y el botón de
-- WhatsApp de las fichas nunca se mostró.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nombre, email, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'telefono', '')), '')
  );
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Crea el perfil al registrarse, copiando nombre, email y teléfono desde la metadata del signUp.';
