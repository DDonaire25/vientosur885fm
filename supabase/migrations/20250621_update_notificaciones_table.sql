-- 20250621_update_notificaciones_table.sql
-- Actualización segura de la tabla notificaciones para mejorar compatibilidad y experiencia

-- Añadir columnas si no existen
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notificaciones' AND column_name='tipo') THEN
    ALTER TABLE notificaciones ADD COLUMN tipo text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notificaciones' AND column_name='titulo') THEN
    ALTER TABLE notificaciones ADD COLUMN titulo text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notificaciones' AND column_name='descripcion') THEN
    ALTER TABLE notificaciones ADD COLUMN descripcion text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notificaciones' AND column_name='created_at') THEN
    ALTER TABLE notificaciones ADD COLUMN created_at timestamp with time zone DEFAULT timezone('utc'::text, now());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notificaciones' AND column_name='leida') THEN
    ALTER TABLE notificaciones ADD COLUMN leida boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notificaciones' AND column_name='link') THEN
    ALTER TABLE notificaciones ADD COLUMN link text;
  END IF;
END $$;

-- Opcional: crear índices para mejorar consultas
create index if not exists idx_notificaciones_user_id on notificaciones(user_id);
create index if not exists idx_notificaciones_leida on notificaciones(leida);
create index if not exists idx_notificaciones_created_at on notificaciones(created_at);

-- Opcional: actualizar valores nulos existentes
update notificaciones set leida = false where leida is null;
update notificaciones set created_at = timezone('utc'::text, now()) where created_at is null;
