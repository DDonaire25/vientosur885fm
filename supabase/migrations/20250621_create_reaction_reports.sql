-- 20250621_create_reaction_reports.sql
-- Crea tabla para reportar reacciones inapropiadas en posts, blogs, eventos y cumpleaños

-- Si la tabla no existe, créala con todas las columnas
create table if not exists reaction_reports (
    id uuid primary key default gen_random_uuid(),
    reaccion_post_id uuid references reacciones_post(id) on delete cascade,
    reaccion_blog_id uuid references reacciones_blog(id) on delete cascade,
    reaccion_evento_id uuid references reacciones_evento(id) on delete cascade,
    reaccion_cumpleanos_id uuid references reacciones_cumpleanos(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade, -- usuario que reporta
    reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    constraint only_one_reaction check (
      (reaccion_post_id is not null)::int + (reaccion_blog_id is not null)::int + (reaccion_evento_id is not null)::int + (reaccion_cumpleanos_id is not null)::int = 1
    ),
    constraint unique_report_post unique (reaccion_post_id, user_id),
    constraint unique_report_blog unique (reaccion_blog_id, user_id),
    constraint unique_report_evento unique (reaccion_evento_id, user_id),
    constraint unique_report_cumpleanos unique (reaccion_cumpleanos_id, user_id)
);

-- Si la tabla ya existe, asegúrate de que la columna y constraints estén presentes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='reaction_reports' AND column_name='reaccion_cumpleanos_id'
  ) THEN
    ALTER TABLE reaction_reports
      ADD COLUMN reaccion_cumpleanos_id uuid references reacciones_cumpleanos(id) on delete cascade;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name='reaction_reports' AND constraint_name='unique_report_cumpleanos'
  ) THEN
    ALTER TABLE reaction_reports
      ADD CONSTRAINT unique_report_cumpleanos UNIQUE (reaccion_cumpleanos_id, user_id);
  END IF;
END $$;

ALTER TABLE reaction_reports DROP CONSTRAINT IF EXISTS only_one_reaction;
ALTER TABLE reaction_reports
  ADD CONSTRAINT only_one_reaction CHECK (
    (reaccion_post_id IS NOT NULL)::int +
    (reaccion_blog_id IS NOT NULL)::int +
    (reaccion_evento_id IS NOT NULL)::int +
    (reaccion_cumpleanos_id IS NOT NULL)::int = 1
  );

-- Índices para consultas rápidas
create index if not exists idx_reaction_reports_post_id on reaction_reports(reaccion_post_id);
create index if not exists idx_reaction_reports_blog_id on reaction_reports(reaccion_blog_id);
create index if not exists idx_reaction_reports_evento_id on reaction_reports(reaccion_evento_id);
create index if not exists idx_reaction_reports_cumpleanos_id on reaction_reports(reaccion_cumpleanos_id);
create index if not exists idx_reaction_reports_user_id on reaction_reports(user_id);
