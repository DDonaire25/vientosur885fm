-- Migración idempotente: Añadir columna parent_id para soporte de comentarios anidados en posts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='comentarios_post' AND column_name='parent_id'
  ) THEN
    ALTER TABLE comentarios_post DROP COLUMN parent_id;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='comentarios_post' AND column_name='parent_id'
  ) THEN
    ALTER TABLE comentarios_post ADD COLUMN parent_id uuid NULL REFERENCES comentarios_post(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comentarios_post_parent_id ON comentarios_post(parent_id);

-- Migración idempotente: Añadir columna parent_id para soporte de comentarios anidados en eventos
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='comentarios_evento' AND column_name='parent_id'
  ) THEN
    ALTER TABLE comentarios_evento DROP COLUMN parent_id;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='comentarios_evento' AND column_name='parent_id'
  ) THEN
    ALTER TABLE comentarios_evento ADD COLUMN parent_id uuid NULL REFERENCES comentarios_evento(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comentarios_evento_parent_id ON comentarios_evento(parent_id);
