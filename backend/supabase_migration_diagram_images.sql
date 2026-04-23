-- Run in Supabase SQL Editor if you already applied supabase_schema.sql without these columns.

alter table public.analysis_results
  add column if not exists architecture_diagram_image_path text,
  add column if not exists usecase_diagram_image_path text,
  add column if not exists sequence_diagram text,
  add column if not exists sequence_diagram_image_path text,
  add column if not exists controlflow_diagram_image_path text,
  add column if not exists class_diagram_image_path text;
