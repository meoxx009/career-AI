import fs from 'fs';

const catalogue = JSON.parse(fs.readFileSync('data/career-catalogue.json', 'utf8'));

console.log('Total roles in catalogue:', catalogue.length);

const rows = catalogue.map(p => {
  const desc = p.description.replace(/'/g, "''");
  const name = p.title.replace(/'/g, "''");
  return `  (${p.numericId}, '${p.slug}', '${name}', '${p.level}', '${desc}', 'CareerAI catalogue', '', '2026-10-02', 'v1', true)`;
});

const sql = `-- Migration: 0004_seed_all_career_roles_and_relax_fk.sql
-- Seeds all 33 unified catalogue career roles and permanently relaxes/protects foreign key constraints.

-- 1. Temporarily drop foreign key constraint on profiles and resume_documents to ensure zero user disruption
alter table public.profiles drop constraint if exists profiles_target_role_id_fkey;
alter table public.resume_documents drop constraint if exists resume_documents_role_id_fkey;
alter table public.roadmaps drop constraint if exists roadmaps_role_id_fkey;

-- 2. Seed all 33 career roles with conflict handling
insert into public.career_roles (id, slug, name, level, description, source_label, source_url, source_checked_at, version, active)
values
${rows.join(',\n')}
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  level = excluded.level,
  description = excluded.description,
  active = excluded.active;

-- 3. Safely re-add foreign key constraints with on delete set null / cascade
alter table public.profiles
  add constraint profiles_target_role_id_fkey
  foreign key (target_role_id) references public.career_roles(id)
  on delete set null;

alter table public.resume_documents
  add constraint resume_documents_role_id_fkey
  foreign key (role_id) references public.career_roles(id)
  on delete set null;

alter table public.roadmaps
  add constraint roadmaps_role_id_fkey
  foreign key (role_id) references public.career_roles(id)
  on delete cascade;
`;

fs.writeFileSync('supabase/migrations/0004_seed_all_career_roles_and_relax_fk.sql', sql, 'utf8');
console.log('Generated supabase/migrations/0004_seed_all_career_roles_and_relax_fk.sql');

const csvHeader = 'id,slug,name,level,description,source_label,source_url,source_checked_at,version\n';
const csvLines = catalogue.map(p => {
  const escapedDesc = '"' + p.description.replace(/"/g, '""') + '"';
  return `${p.numericId},${p.slug},${p.title},${p.level},${escapedDesc},"CareerAI catalogue","","2026-10-02","v1"`;
});
fs.writeFileSync('data/roles.csv', csvHeader + csvLines.join('\n') + '\n', 'utf8');
console.log('Updated data/roles.csv with all 33 roles');
