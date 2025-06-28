-- Migración idempotente: Añadir columna parent_id para soporte de comentarios anidados en blogs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='comentarios_blog' AND column_name='parent_id'
  ) THEN
    ALTER TABLE comentarios_blog DROP COLUMN parent_id;
  END IF;
END $$;

ALTER TABLE comentarios_blog
ADD COLUMN parent_id uuid NULL REFERENCES comentarios_blog(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comentarios_blog_parent_id ON comentarios_blog(parent_id);
